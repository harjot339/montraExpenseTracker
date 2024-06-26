import { StyleSheet } from "react-native";
import { COLORS } from "../../constants/commonStyles";

const styles = StyleSheet.create({
    safeView: { flex: 1, backgroundColor: COLORS.PRIMARY.LIGHT },
    mainView: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 20
    },
    text1: {
        fontSize: 32,
        textAlign: "center",
        fontWeight: "bold"
    },
    text2: {
        fontSize: 16,
        textAlign: "center",
        color: "grey"
    },
    carouselCtr: { paddingHorizontal: 20 },
    progressDotCtr: {
        flexDirection: 'row',
        gap: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressDot: {

        borderRadius: 10,
    },
})
export default styles