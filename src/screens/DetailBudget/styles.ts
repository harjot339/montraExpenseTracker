import { StyleSheet } from "react-native";
import { COLORS } from "../../constants/commonStyles";

const styles = StyleSheet.create({
    safeView: {
        flex: 1,
        paddingHorizontal: 30,
        backgroundColor: COLORS.LIGHT[100],
        paddingBottom:20
    },
    mainView: {
        flex: 1,
        backgroundColor: COLORS.LIGHT[100],
        alignItems: "center",
        justifyContent: "flex-start",
    },
    catCtr: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.LIGHT[20],
        backgroundColor: COLORS.LIGHT[80],
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 24,
        columnGap: 7,
        marginBottom: 20
    },
    colorBox: {
        padding: 8,
        borderRadius: 10,

    },
    catText: { fontSize: 18, fontWeight: '600' },
    remainText: {
        fontSize: 24, fontWeight: '600', marginBottom: 10
    },
    amtText: { fontSize: 64, fontWeight: '600', marginBottom: 15 },
    limitCtr: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.RED[100],
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 24,
        columnGap: 7,
        marginTop: 40
    },
    limitText: {
        fontSize: 14, fontWeight: '600', color: COLORS.LIGHT[100]
    }
})

export default styles