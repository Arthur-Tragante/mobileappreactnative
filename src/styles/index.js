import { StyleSheet } from "react-native";
import { bgHeader, primaryLight, primaryDark } from "../global.styles";
import Colors from "./Colors";

const defaultStyles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 1,
  },
  centerContentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    flex: 1,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  textLabel: {
    marginBottom: 7,
    fontSize: 18,
  },
  labeledTextStyle: {
    alignItems: "stretch",
    marginBottom: 5,
    flex: 1,
  },
  buttonIcon: {
    color: "white",
    fontSize: 20,
    height: 22,
  },
  textCenter: {
    textAlign: 'center',
    paddingRight: 32,
    paddingLeft: 32,
    color: '#777',
    fontSize: 18,
  },
  textLeft: {
    alignSelf: 'stretch',
    textAlign: 'left',
  },
  textRight: {
    alignSelf: 'stretch',
    textAlign: 'right',
  },
  textCenterAtBottom: {
    position: 'absolute',
    textAlign: 'center',
    paddingRight: 32,
    paddingLeft: 32,
    color: '#777',
    fontSize: 18,
    bottom: 0,
  },
  textWhite: {
    color: 'white',
  },
  textHeader: {
    color: bgHeader,
    fontSize: 40,
  },
  inputBox: {
    marginRight: '3%',
    marginLeft: '3%',
    marginTop: '3%'
  },
  inputBoxIcon: {
    color: primaryLight,
  },
  inputBoxText: {
    textAlign: 'left',
  },
  disabledInputBoxText: {
    backgroundColor: Colors.red,
  },
  listItem: {
    justifyContent: 'center',
    alignContent: 'center',
    alignSelf: 'center',
    fontSize: 16,
  },
  listItemRightText: {
    color: primaryLight,
    textAlign: "right",
    fontWeight: "400",
    fontSize: 15,
  },
  listItemRightContainer: {
    alignSelf: 'flex-start',
    width: 80,
    flex: 1,
  },
  primaryLightText: {
    color: primaryLight,
  },
  primaryDarkText: {
    color: primaryDark,
  },
  primaryLightBackground: {
    backgroundColor: primaryLight,
  },
  primaryDarkBackground: {
    backgroundColor: primaryDark,
  },
});

export default defaultStyles;
