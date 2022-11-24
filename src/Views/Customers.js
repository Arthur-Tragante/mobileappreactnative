import React from 'react';
import { connect } from 'react-redux';
import CustomerList from './Lists/CustomerList';

const Customers = () => {
  return (<CustomerList />);
};

export default connect(
)(Customers);
