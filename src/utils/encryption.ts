import CryptoJS from "react-native-crypto-js";

export function encrypt(text: string, key: string) {
    return CryptoJS.AES.encrypt(text, key).toString();
}
export function decrypt(text: string, key: string) {
    try {
        return CryptoJS.AES.decrypt(text, key).toString(CryptoJS.enc.Utf8)
    } catch (e) {
        console.log(e)
        return undefined
    }
}