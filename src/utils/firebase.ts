import firestore, { FirebaseFirestoreTypes, Timestamp } from "@react-native-firebase/firestore";
import { repeatDataType, transactionType } from "../defs/transaction";
import { UserFromJson, UserToJson } from "./userFuncs";
import { UserType } from "../defs/user";
import storage from '@react-native-firebase/storage';
import notifee from '@notifee/react-native';
import uuid from 'react-native-uuid';
import { encrypt } from "./encryption";
import auth from '@react-native-firebase/auth';
export async function createTransaction({
    id,
    url,
    attachementType,
    amount,
    conversion,
    currency,
    category,
    desc, wallet,
    repeatData,
    isEdit,
    transaction,
    pageType,
    uid
}: {
    id: string;
    url: string;
    attachementType: transactionType['attachementType'];
    amount: string,
    conversion: {
        [key: string]: {
            [key: string]: number;
        };
    },
    currency: string,
    category: string,
    desc: string,
    wallet: string,
    repeatData: repeatDataType,
    isEdit: boolean,
    transaction: transactionType,
    pageType: "income" | "expense" | "transfer",
    uid: string
}) {
    return {
        amount: await encrypt(String((Number(amount) / conversion['usd'][currency.toLowerCase()]).toFixed(2)), uid),
        category: await encrypt(category, uid),
        desc: await encrypt(desc, uid),
        wallet: await encrypt(wallet, uid),
        attachement: await encrypt(url, uid),
        repeat: repeatData !== undefined,
        freq: repeatData ? {
            freq: await encrypt(repeatData.freq, uid),
            month: await encrypt(String(repeatData.month), uid),
            day: await encrypt(String(repeatData.day), uid),
            weekDay: await encrypt(String(repeatData.weekDay), uid),
            end: await encrypt(repeatData.end, uid),
            date: repeatData.date,
        } : null,
        id: isEdit ? transaction.id : id,
        timeStamp: isEdit ? transaction.timeStamp : Timestamp.now(),
        type: await encrypt(pageType, uid),
        attachementType: await encrypt(attachementType, uid),
    };
}
export async function updateTransaction({ trans, uid, transId }: { trans: transactionType, uid: string, transId: string }) {
    await firestore()
        .collection('users')
        .doc(uid)
        .collection('transactions')
        .doc(transId)
        .update(trans);
}

export async function addNewTransaction({
    id,
    trans,
    uid
}: {
    id: string;
    trans: transactionType;
    uid: string
}) {
    await firestore()
        .collection('users')
        .doc(uid)
        .collection('transactions')
        .doc(id)
        .set(trans);
}

export async function handleIncomeUpdate({
    curr,
    uid,
    month,
    category,
    transaction,
    amount,
    conversion,
    currency
}: {
    curr: FirebaseFirestoreTypes.DocumentSnapshot<FirebaseFirestoreTypes.DocumentData>;
    uid: string,
    month: number,
    category: string,
    transaction: transactionType,
    amount: number,
    conversion: {
        [key: string]: {
            [key: string]: number;
        };
    },
    currency: string
}) {
    await firestore()
        .collection('users')
        .doc(uid)
        .update({
            [`income.${month}.${category}`]:
                await encrypt(String(((((
                    await UserFromJson(curr.data() as UserType)
                ).income[month][category] ?? 0) -
                    transaction.amount +
                    Number(amount)) /
                    conversion['usd'][currency.toLowerCase()]).toFixed(2)), uid),
        });
}
export async function handleNewIncome({
    curr,
    uid,
    month,
    category,
    amount,
    conversion,
    currency
}: {
    curr: FirebaseFirestoreTypes.DocumentSnapshot<FirebaseFirestoreTypes.DocumentData>;
    uid: string,
    month: number,
    category: string,
    amount: number,
    conversion: {
        [key: string]: {
            [key: string]: number;
        };
    },
    currency: string
}) {
    await firestore()
        .collection('users')
        .doc(uid)
        .update({
            [`income.${month}.${category}`]:
                await encrypt(String(((((
                    await UserFromJson(curr.data() as UserType)
                )?.income[month]?.[category] ?? 0) +
                    Number(amount)) /
                    conversion['usd'][currency.toLowerCase()]).toFixed(2)), uid),
        });
}

export async function handleExpenseUpdate({
    curr,
    uid,
    month,
    category,
    transaction,
    amount,
    conversion,
    currency
}: {
    curr: FirebaseFirestoreTypes.DocumentSnapshot<FirebaseFirestoreTypes.DocumentData>;
    uid: string,
    month: number,
    category: string,
    transaction: transactionType,
    amount: number,
    conversion: {
        [key: string]: {
            [key: string]: number;
        };
    },
    currency: string
}) {
    await firestore()
        .collection('users')
        .doc(uid)
        .update({
            [`spend.${month}.${category}`]:
                await encrypt(String(((((
                    await UserFromJson(curr.data() as UserType)
                ).spend[month][category] ?? 0) -
                    transaction.amount +
                    Number(amount)) /
                    conversion['usd'][currency.toLowerCase()]).toFixed(2)), uid),
        });
}

export async function handleNewExpense({
    curr,
    uid,
    month,
    category,
    amount,
    conversion,
    currency
}: {
    curr: FirebaseFirestoreTypes.DocumentSnapshot<FirebaseFirestoreTypes.DocumentData>;
    uid: string,
    month: number,
    category: string,
    amount: number,
    conversion: {
        [key: string]: {
            [key: string]: number;
        };
    },
    currency: string
}) {
    await firestore()
        .collection('users')
        .doc(uid)
        .update({
            [`spend.${month}.${category}`]:
                await encrypt(String(((((
                    await UserFromJson(curr.data() as UserType)
                )?.spend[month]?.[category] ?? 0) +
                    Number(amount)) /
                    conversion['usd'][currency.toLowerCase()]).toFixed(2)), uid),
        });
}
export async function getAttachmentUrl({
    attachement,
    id,
    uid
}: {
    attachement: string;
    id: string;
    uid: string;
}) {
    let url = '';
    if (attachement !== '') {
        if (!attachement?.startsWith('https://firebasestorage.googleapis.com')) {
            await storage().ref(`users/${uid}/${id}`).putFile(attachement);
            url = await storage().ref(`users/${uid}/${id}`).getDownloadURL();
        } else {
            url = attachement;
        }
    }
    return url;
}
export async function handleNotify({
    curr,
    totalSpent,
    uid,
    month,
    category
}: {
    curr: FirebaseFirestoreTypes.DocumentSnapshot<FirebaseFirestoreTypes.DocumentData>;
    totalSpent: number;
    uid: string,
    month: number,
    category: string
}) {
    const totalBudget = (await UserFromJson(curr.data() as UserType))?.budget?.[
        month
    ]?.[category];
    if (
        totalBudget &&
        totalSpent >= totalBudget.limit * (totalBudget.percentage / 100)
    ) {
        try {
            const notificationId = uuid.v4();
            await firestore()
                .collection('users')
                .doc(uid)
                .update({
                    [`notification.${notificationId}`]: {
                        type: await encrypt('budget', uid),
                        category: await encrypt(category, uid),
                        id: notificationId,
                        time: Timestamp.now(),
                        read: false,
                    },
                });
            await notifee.requestPermission();
            const channelId = await notifee.createChannel({
                id: 'default',
                name: 'Default Channel',
            });
            await notifee.displayNotification({
                title:
                    category[0].toUpperCase() +
                    category.slice(1) +
                    ' budget has exceeded the limit',
                body:
                    'Your ' +
                    category[0].toUpperCase() +
                    category.slice(1) +
                    ' budget has exceeded the limit',
                android: {
                    channelId,
                },
            });
        } catch (e) {
            console.log(e);
        }
    }
}

export async function singupUser({ name, email, pass }: { name: string, email: string, pass: string }) {
    try {
        const creds = await auth().createUserWithEmailAndPassword(email, pass);
        if (creds) {
            const encrpytedUser = await UserToJson({
                name: name,
                email: email,
                uid: creds.user.uid,
                pin: '',
            });
            await firestore()
                .collection('users')
                .doc(creds.user.uid)
                .set(encrpytedUser);
            return true;
        }
    } catch (e) {
        console.log(e)
        return false
    }
    return false
}
