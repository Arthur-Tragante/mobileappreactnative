import React from 'react';
import { connect } from 'react-redux';
import OrderList from "./Lists/OrderList";

const Orders = () => (
  <OrderList />
);

export default connect(
)(Orders);
