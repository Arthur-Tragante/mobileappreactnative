import { primaryLight, primaryDark } from "../../global.styles";
import { StyleSheet } from "react-native";
import Colors from "../Colors";

const footerStyles = StyleSheet.create({
    footer: {
        backgroundColor: primaryDark,
    },
    footerText: {
        color: Colors.white,
    },
    orderFooter: {
        backgroundColor: primaryDark,
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        flexDirection: "row",
    }
});

export default footerStyles;