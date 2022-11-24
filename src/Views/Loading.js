import { bgHeader } from "../global.styles";
import { StyleSheet } from 'react-native';
import { Spinner } from 'native-base';
import React from "react";

export default class LoadingScreen extends React.Component {
    render() {
        return (
            <Spinner color={bgHeader}/>
        );
    }
}

const styles = StyleSheet.create({
    activityIndicator: {
        paddingBottom: 10,
        paddingTop: 10,
    },
});