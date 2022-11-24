import { primaryDark } from "../../global.styles";
import { StyleSheet } from "react-native";
import Colors from "../Colors";

const modalStyles = StyleSheet.create({
  modal: {
    width: 200,
    height: 200,
    position: 'absolute',
    top: '30%',
    backgroundColor: 'white',
    alignSelf: 'center',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 4,
    borderColor: primaryDark
  },
  modalBig: {
    width: 350,
    height: 580,
    position: 'absolute',
    top: '15%',
    backgroundColor: 'white',
    alignSelf: 'center',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 4,
    borderColor: primaryDark
  },  
  modalText: {
    color: Colors.black,
  },

});

export default modalStyles;