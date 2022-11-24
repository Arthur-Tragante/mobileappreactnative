import { primaryLight } from "../../global.styles";
import { StyleSheet } from "react-native";
import Colors from "../Colors";

const tabStyles = StyleSheet.create({
    tabs: {
        backgroundColor: primaryLight,
    },
    tabsText: {
        color: Colors.white,
    }
});

export default tabStyles;