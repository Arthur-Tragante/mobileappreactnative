import React from "react";
import { View, RefreshControl, StyleSheet, Dimensions, FlatList } from "react-native";
import { Footer, FooterTab, Button, Icon, Text, Content, Segment, Label, Grid, Col, Card, CardItem, ListItem, Left, Right } from "native-base";
import { formataRealString, addDays, formataDataString, getDaysInBetween } from '../utils';
import { VictoryChart, VictoryTheme, VictoryLine, VictoryAxis } from 'victory-native';
import { primaryDark, primaryLight } from "../global.styles";
import firestoreWrapper from "../services/FirestoreWrapper";
import localStorage from "../services/LocalStorage";
import segmentStyles from "../styles/Segment";
import marginStyles from "../styles/margin";
import footerStyles from "../styles/Footer";
import Colors from "../styles/Colors";
import defaultStyles from "../styles";
import * as Actions from "../Redux/actions";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import PropTypes from "prop-types";
import viewActions from '../Views/ViewActions';
import toastWrapper from "../services/ToastWrapper";
import LoadingScreen from "./Loading";

class Dashboard extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      isRefreshing: false,
      showRender: false,
      currentSegment: 0,
      mounted: false,
      username: '',
      period: 7,

      ordersGraphData: [],
      recentOrders: [],
      ordersLength: 0,
      ordersTotal: 0,
    };
  }

  static propTypes = {
    activeRoute: PropTypes.shape({
      name: PropTypes.string.isRequired,
      screen: PropTypes.any.isRequired,
      icon: PropTypes.string
    }).isRequired,
    routes: PropTypes.arrayOf(PropTypes.object).isRequired,
    navigateTo: PropTypes.func.isRequired
  };

  onRefresh = async () => {
    this.setState({
      isRefreshing: true,
    });

    let username = await localStorage.getValueAsync('user.name');
    let orders = await firestoreWrapper.getOrdersAsync() || [];

    orders = orders.filter(order => {
      return new Date(order.DataVenda) >= addDays(new Date(), this.state.period * -1);
    });

    const ordersTotal = orders.reduce((sum, { ValorTotal }) => {
      return sum + parseFloat(ValorTotal)
    }, 0);

    let minDate = addDays(new Date(), this.state.period * -1);
    let graphPeriod = getDaysInBetween(new Date(), minDate);
    let graphData = [];

    for (let i = 1; i <= graphPeriod; i++) {
      minDate = addDays(minDate, 1);

      let ordersCount = orders.filter(order => {
        let orderDate = new Date(order.DataVenda);

        return (
          orderDate.getMonth() == minDate.getMonth() &&
          orderDate.getDate() == minDate.getDate()
        );
      }).length;


      graphData.push({
        x: `${minDate.getDate()}`,
        y: ordersCount,
      })
    }

    this.setState({
      recentOrders: orders.slice(0, 5),
      ordersLength: orders.length,
      ordersGraphData: graphData,
      ordersTotal: ordersTotal,
      username: username,
    });

    setTimeout(() => {
      this.setState({
        isRefreshing: false,
        mounted: true,
      });
    }, 500);

    const customerSyncActive = parseInt(await localStorage.getValueAsync('app.customerSyncActive'));
    const productSyncActive = parseInt(await localStorage.getValueAsync('app.productSyncActive'));
    let toastMessage = null;

    if (customerSyncActive && productSyncActive) {
      toastMessage = 'Sincronização inicial de produtos e clientes em andamento...';
    }
    else if (customerSyncActive) {
      toastMessage = 'Sincronização inicial de clientes em andamento...';
    }
    else if (productSyncActive) {
      toastMessage = 'Sincronização inicial de produtos em andamento...';
    }

    if (toastMessage) {
      setTimeout(() => {
        toastWrapper.showToast(toastMessage);
      }, 2500);
    }
  }

  async componentDidMount() {
    await localStorage.setValueAsync('data.leuEstoque', 'false')
    
    await this.onRefresh();

    this.setState({
      showRender: true,
    });
  }

  getHeaderFontSize() {
    if (this.state.ordersTotal > 10000000) {
      return 20;
    }
    else if (this.state.ordersTotal > 1000000) {
      return 23;
    }
    else if (this.state.ordersTotal > 100000) {
      return 24;
    }
    else {
      return 25;
    }
  }

  render() {
    if (!this.state.showRender) {
      return (
        <View style={defaultStyles.centerContentContainer}>
          <LoadingScreen />
        </View>
      )
    }

    return (
      <View style={defaultStyles.container}>
        <Content
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={this.onRefresh}
            />
          }
        >
          <Segment style={marginStyles.top20}>
            <Button
              first
              style={[this.state.currentSegment == 0 ? segmentStyles.segmentActiveButton : segmentStyles.segmentInactiveButton]}
              onPress={() => {
                this.setState({
                  currentSegment: 0,
                  period: 7,
                }, () => {
                  this.onRefresh();
                });
              }}
            >
              <Text
                style={[this.state.currentSegment == 0 ? segmentStyles.segmentActiveText : segmentStyles.segmentInactiveText]}
              >
                7 dias
                  </Text>
            </Button>

            <Button
              last
              style={[this.state.currentSegment == 1 ? segmentStyles.segmentActiveButton : segmentStyles.segmentInactiveButton]}
              onPress={() => {
                this.setState({
                  currentSegment: 1,
                  period: 30,
                }, () => {
                  this.onRefresh();
                });
              }}
            >
              <Text
                style={[this.state.currentSegment == 1 ? segmentStyles.segmentActiveText : segmentStyles.segmentInactiveText]}
              >
                30 dias
              </Text>
            </Button>
          </Segment>

          {
            this.state.mounted &&
            <View>
              <Card style={[marginStyles.top20, styles.card, { minHeight: 150 }]}>
                <CardItem header style={{ paddingBottom: 0 }}>
                  <Text style={[styles.cardHeader, defaultStyles.textLeft]}>
                    Olá, {this.state.username}!
              </Text>
                </CardItem>
                <View style={styles.cardCenter}>
                  <CardItem>
                    <Grid>
                      <Col>
                        <Label style={[styles.labelHeader, {
                          fontSize: this.getHeaderFontSize()
                        }]}>
                          {this.state.ordersLength}
                        </Label>
                        <Label style={[styles.labelText]}>
                          {
                            this.state.ordersLength == 1
                              ? 'Venda'
                              : 'Vendas'
                          }
                        </Label>
                      </Col>

                      <Col>
                        <Label style={[styles.labelHeader, {
                          fontSize: this.getHeaderFontSize()
                        }]}>
                          {formataRealString(this.state.ordersTotal)}
                        </Label>
                        <Label style={[styles.labelText]}>
                          Total
                    </Label>
                      </Col>
                    </Grid>
                  </CardItem>
                </View>
              </Card>

              <Card style={[marginStyles.top20, styles.card, {
                minHeight: this.state.recentOrders.length > 0 ? 380 : 'auto'
              }]}>
                <CardItem header style={{ paddingBottom: 0 }}>
                  <Text style={[styles.cardHeader, defaultStyles.textLeft]}>Vendas no período</Text>
                </CardItem>
                <CardItem>
                  {
                    this.state.recentOrders.length > 0 &&
                    <View pointerEvents='none'>
                      <VictoryChart
                        width={Dimensions.get('window').width * 0.90}
                        theme={VictoryTheme.material}
                        height={300}
                      >
                        <VictoryAxis
                          dependentAxis
                          style={{
                            tickLabels: { fontSize: 10 },
                          }}
                        />
                        <VictoryAxis
                          style={{
                            tickLabels: { fontSize: 10, angle: 45 },
                          }}
                        />
                        <VictoryLine
                          data={this.state.ordersGraphData}
                          animate={true}
                          style={{
                            parent: { border: "1px solid #ccc" },
                            data: { stroke: primaryLight },
                          }}
                        />
                      </VictoryChart>
                    </View>
                  }
                  {
                    this.state.recentOrders.length == 0 &&
                    <Label style={styles.graphText}>
                      Não existem vendas para o período selecionado.
                    </Label>
                  }
                </CardItem>
              </Card>

              <Card style={[marginStyles.top20, marginStyles.bottom20, styles.card, { margin: 0, padding: 0 }]}>
                <CardItem header style={{ paddingBottom: 0, flexDirection: 'row' }}>
                  <Col>
                    <Text style={[styles.cardHeader, defaultStyles.textLeft]}>Vendas recentes</Text>
                  </Col>
                  <Col>
                    {
                      this.state.recentOrders.length > 0 &&
                      <Text
                        style={[styles.cardHeader, defaultStyles.textRight]}
                        onPress={() => {
                          this.props.navigateTo('Vendas');
                        }}
                      >
                        Ver todas
                      </Text>
                    }
                  </Col>
                </CardItem>
                <CardItem>
                  {
                    this.state.recentOrders.length > 0 &&
                    <FlatList
                      keyExtractor={item => item.uuid.toString()}
                      data={this.state.recentOrders}
                      renderItem={({ item }) => {
                        return (
                          <ListItem
                            style={styles.listItem}
                            onPress={() => {
                              this.props.setViewAction(viewActions.viewing);
                              this.props.setViewActionPai(viewActions.viewing);
                              this.props.setOrder(item);
                              this.props.navigateTo('Venda');
                            }}
                          >
                            <Left>
                              <Label style={styles.listItemLeft}>
                                {`${(item.Codigo || '').toString().padStart(4, "0")} - ${item.EntregaNome}`}
                                {'\n'}
                                {formataRealString(item.ValorTotal)}
                              </Label>
                            </Left>
                            <Right>
                              <Label style={styles.listItemRight}>
                                {formataDataString(item.DataVenda)}
                                {'\n'}
                                {`${item.Itens.length} ite${item.Itens.length == 1 ? "m" : "ns"}`}
                              </Label>
                            </Right>
                          </ListItem>
                        )
                      }}
                    />
                  }
                  {
                    this.state.recentOrders.length == 0 &&
                    <Label style={styles.graphText}>
                      Não existem vendas para o período selecionado.
                    </Label>
                  }
                </CardItem>
              </Card>
            </View>
          }
        </Content>

        <Footer style={footerStyles.footer}>
          <FooterTab style={footerStyles.footer}>
            <Button vertical onPress={() => {
              this.props.setViewAction(null);
              this.props.setViewActionPai(null);
              this.props.navigateTo('Produtos');
            }}>
              <Icon
                name="apps"
                style={footerStyles.footerText}
              />
              <Text style={footerStyles.footerText}>Produtos</Text>
            </Button>
            <Button vertical onPress={() => {
              this.props.setViewAction(viewActions.creating);
              //this.props.setViewActionPai(viewActions.creating);
              this.props.setOrder(null);
              this.props.navigateTo('Venda');
            }}>
              <Icon
                name="cart"
                style={footerStyles.footerText}
              />
              <Text style={footerStyles.footerText}>Vender</Text>
            </Button>
            <Button vertical onPress={() => {
              this.props.setViewAction(null);
              this.props.setViewActionPai(null);
              this.props.navigateTo('Clientes');
            }}>
              <Icon
                style={footerStyles.footerText}
                name="person"
              />
              <Text style={footerStyles.footerText}>Clientes</Text>
            </Button>
          </FooterTab>
        </Footer>
      </View >
    );
  }
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: Dimensions.get('window').width * 0.90,
    backgroundColor: Colors.white,
    borderColor: primaryDark,
    borderWidth: 1,
  },
  cardCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  cardHeader: {
    color: primaryDark,
  },
  labelHeader: {
    textAlign: 'center',
    color: primaryDark,
    fontWeight: "400",
  },
  labelText: {
    color: primaryLight,
    textAlign: 'center',
    fontWeight: "200",
    fontSize: 20,
  },
  listItem: {
    paddingRight: 0,
    marginRight: 0,
    paddingLeft: 0,
    marginLeft: 0,
    width: '100%',
  },
  listItemLeft: {
    alignSelf: 'stretch',
    textAlign: 'left',
    fontSize: 14,
  },
  listItemRight: {
    alignSelf: 'stretch',
    color: primaryLight,
    textAlign: 'right',
    fontSize: 13,
  },
  graphText: {
    textAlign: 'left',
    marginBottom: 10,
    marginLeft: 10,
    fontSize: 14,
  },
});

const mapStateToProps = (state) => ({
  activeRoute: state.routes.activeRoute,
  routes: state.routes.routes,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(Actions, dispatch);
;

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Dashboard);