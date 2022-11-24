import { primaryDark } from "../../global.styles";
import { StyleSheet } from "react-native";
import Colors from "../Colors";

const segmentStyles = StyleSheet.create({
    segmentInactiveButton: {
        backgroundColor: Colors.white,
        borderColor: primaryDark,
    },
    segmentActiveButton: {
        backgroundColor: primaryDark,
        borderColor: primaryDark,
    },
    segmentInactiveText: {
        color: primaryDark,
        marginRight: 10,
        marginLeft: 10
    },
    segmentActiveText: {
        color: Colors.white,
        marginRight: 10,
        marginLeft: 10
    },
    segmentActiveDetailText: {
        color: Colors.white,
        marginRight: 20,
        marginLeft: 20,
        fontSize: 20
    },
    segmentInactiveDetailText: {
        color: primaryDark,
        marginRight: 20,
        marginLeft: 20,
        fontSize: 20
    }
});

export default segmentStyles;