import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../redux/store";
import firestore from '@react-native-firebase/firestore';
import { transactionType } from "../defs/transaction";
import { userLoggedIn } from "../redux/reducers/userSlice";
import { UserType } from "../defs/user";
import { UserFromJson } from "../utils/userFuncs";
import { TransFromJson } from "../utils/transFuncs";
import { useQuery, useRealm } from "@realm/react";
import { OnlineTransactionModel } from "../DbModels/OnlineTransactionModel";
export function useInitialSetup() {
    const realm = useRealm();
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user.currentUser);
    useEffect(() => {
        const unsubscribe = firestore()
            .collection('users')
            .doc(user!.uid)
            .onSnapshot(snapshot => {
                const user = UserFromJson(snapshot.data() as UserType)
                console.log(user)
                dispatch(userLoggedIn(user));
            });
        return () => unsubscribe();

    }, []);
    const transactions = useQuery(OnlineTransactionModel)
    useEffect(() => {
        const unsubscribe = firestore()
            .collection('users')
            .doc(user!.uid)
            .collection('transactions')
            .orderBy('timeStamp', 'desc')
            .onSnapshot((snapshot) => {
                const data: transactionType[] = snapshot.docs.map(
                    doc => (TransFromJson(doc.data(), user!.uid)),
                );
                console.log(data)
                realm.write(() => {
                    realm.delete(transactions)
                });
                data.forEach((item) => {
                    realm.write(() => {
                        realm.create('OnlineTransaction', item);
                    });
                })

                // const formatData = data.reduce(
                //     (acc: { [key: string]: transactionType }, item) => {
                //         acc[item.timeStamp.seconds] = item;
                //         return acc;
                //     },
                //     {},
                // );
                // dispatch(setTransaction(formatData));
            });
        return () => unsubscribe();

    }, []);

}