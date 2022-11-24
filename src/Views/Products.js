import React from 'react';
import { connect } from 'react-redux';
import ProductList from "./Lists/ProductList";

const Products = () => (
  <ProductList />
);

export default connect(
)(Products);