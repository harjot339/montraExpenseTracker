import { StyleSheet } from "react-native";
import { COLORS } from "../../constants/commonStyles";

const styles = StyleSheet.create({
    safeView: {
        flex: 1,
        alignItems: "center",
        // justifyContent:"center",
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    mainView: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: 20
    },
    amt: { fontSize: 48, fontWeight: "700", color: COLORS.LIGHT[100] },
    desc: { fontSize: 16, fontWeight: "500", color: COLORS.LIGHT[80], marginTop: 10 },
    time: { fontSize: 13, fontWeight: "500", color: COLORS.LIGHT[80], marginTop: 10 },
    text1: { color: COLORS.DARK[25], fontSize: 14, fontWeight: "500" },
    text2: { fontSize: 16, fontWeight: "600" },
    descTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.DARK[25],
        marginBottom: 10,
    },
    descText: {
        fontSize: 16, fontWeight: "600", marginBottom: 20
    },
    bottomView: {
        flex: 2,
        backgroundColor: 'white',
        width: '100%',
        paddingHorizontal: 20,
    },
    ctr: {
        flexDirection: 'row',
        backgroundColor: 'white',
        columnGap: 50,
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.LIGHT[20],
        transform: [{ translateY: -40 }],
    },
    ctrColumn:{alignItems: 'center', rowGap: 8},
    descCtr:{flex: 1, transform: [{translateY: -20}]},
    btnView:{transform: [{translateY: -40}]}
})

export default styles;