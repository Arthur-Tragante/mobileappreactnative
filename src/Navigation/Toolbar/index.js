import { Header, Left, Body, Button, Title, Icon, Right, Item, Input } from 'native-base';
import * as Actions from "../../Redux/actions";
import { Alert, View, StyleSheet } from "react-native";
import { bgHeader } from "../../global.styles";
import { bindActionCreators } from "redux";
import Colors from '../../styles/Colors';
import defaultStyles from '../../styles';
import { connect } from "react-redux";
import PropTypes from "prop-types";
import React from "react";
import viewActions from '../../Views/ViewActions';

class Toolbar extends React.Component {
  constructor(props) {
    super(props);

    this.previousRouteName = this.props.activeRoute.name;

    this.state = {
      searchVisible: false,
      previousQuery: '',
      voltando: false,
    }
  }

  handleBackButton = () => {
      Alert.alert(
        'ATENÇÃO!',
        'Se tentar voltar para a tela inicial, você perderá os detalhes da venda!',
        [
          {
            text: 'Permitir voltar', 
            onPress: () =>
              this.setState({
                voltando: true,
              })            
          },
          {
            text: 'Cancelar',
            style: 'cancel'
          }
        ],
        {cancelable: false},
      );
    return false;
  }    

  resetSearch() {
    this.setState({
      searchVisible: false,
      previousQuery: '',
    });

    this.props.handleSearch('');
  }

  componentDidUpdate() {
    if (this.props.activeRoute.name != this.previousRouteName) {
      this.setState({
        voltando: false
      });
      this.resetSearch();
    }
    else if (this.props.query != this.state.previousQuery) {
      this.setState({
        previousQuery: this.props.query,
      });

      if (this.props.query) {
        this.setState({
          searchVisible: true,
        });
      }
    }

    this.previousRouteName = this.props.activeRoute.name;
  }

  static propTypes = {
    activeRoute: PropTypes.shape({
      name: PropTypes.string.isRequired,
      screen: PropTypes.any.isRequired,
      icon: PropTypes.string
    }).isRequired,
    routes: PropTypes.arrayOf(PropTypes.object).isRequired,
    showMenu: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
    navigateTo: PropTypes.func.isRequired
  };

  render() {
    const { showMenu, goBack, activeRoute, runningAnimation, viewAction, viewActionPai } = this.props;

    if (activeRoute.header & !runningAnimation) {
      return (
        <View>
          <Header
            searchBar={activeRoute.searchVisible}
            androidStatusBarColor={bgHeader}
            style={styles.header}
            rounded={true}
          >
            {
              !this.state.searchVisible &&
              <Left>
                <Button
                  style={styles.headerButton}
                  transparent
                  large
                  onPress={
                    ((activeRoute.sidemenu && viewAction != 'selecting') || activeRoute.name=='Master mobile') ? 
                      showMenu : 
                      (activeRoute.name == 'Venda' && viewAction != viewActions.selecting ? (this.state.voltando? goBack : this.handleBackButton) : goBack)
                  }
                >
                  <Icon
                    name={((activeRoute.sidemenu && viewAction != 'selecting') || activeRoute.name=='Master mobile') ? "menu" : "arrow-back"}
                    //onPress={(activeRoute.sidemenu && viewAction != 'selecting') ? showMenu : goBack}
                    color={Colors.white}
                  />
                </Button>
              </Left>
            }
            <Body style={{ flex: 3 }}>
              {
                (viewAction == 'selecting' && viewActionPai == 'Criando' && activeRoute.name == 'Venda') ?
                  <Title style={styles.headerTitle}>{`Criando ${activeRoute.name}`}</Title>
                  : !this.state.searchVisible ?
                    <Title style={styles.headerTitle}>{`${activeRoute.sidemenu || viewAction == 'selecting' || viewAction == 'viewing' ? '' : viewAction} ${activeRoute.name}`}</Title>
                    : null
              }
              {
                this.state.searchVisible &&
                <Item>
                  <Input
                    placeholderTextColor={Colors.white}
                    value={this.state.previousQuery}
                    style={defaultStyles.textWhite}
                    placeholder="Pesquisa..."
                    blurOnSubmit={false}
                    autoFocus={true}
                    onChangeText={(text) => {
                      this.props.handleSearch(text);
                    }}
                    onSubmitEditing={(text) => {
                      this.props.handleSearch(text.nativeEvent.text, true);
                    }}
                  />
                  <Button
                    style={styles.headerButton}
                    transparent
                    large
                    onPress={() => {
                      this.resetSearch();
                    }}
                  >
                    <Icon
                      style={defaultStyles.textWhite}
                      name='close'
                    />
                  </Button>
                </Item>
              }
            </Body>
            {
              !this.state.searchVisible &&
              <Right>
                {
                  activeRoute.searchVisible &&
                  <Button
                    style={styles.headerButton}
                    transparent
                    large
                    onPress={() => {
                      this.setState({
                        searchVisible: true,
                      });
                    }}
                  >
                    <Icon
                      name='search'
                    />
                  </Button>
                }
              </Right>
            }
          </Header>
        </View>
      );
    }

    return null;
  }
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: bgHeader,
    height: 80, // 56dp AppBar height plus 24dp correction for the StatusBar translucent
    paddingTop: 24 // StatusBar's height
  },
  headerButton: {
    paddingTop: 12, // StatusBar's height
  },
  headerTitle: {
    marginLeft: 15
  }
});

const mapStateToProps = (state, ownProps) => ({
  activeRoute: state.routes.activeRoute,
  routes: state.routes.routes,
  showMenu: ownProps.showMenu,
  goBack: ownProps.goBack,
  query: state.routes.query,
  querySubmit: state.routes.querySubmit,
  viewAction: state.routes.viewAction,
  viewActionPai: state.routes.viewActionPai,
  runningAnimation: state.routes.runningAnimation,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(Actions, dispatch);
;

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Toolbar);
