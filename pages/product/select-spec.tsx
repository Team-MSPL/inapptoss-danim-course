import React, {useEffect} from 'react';
import { Text, View } from 'react-native';
import { createRoute } from '@granite-js/react-native';
import axios from "axios";
import {lowestPriceFromEntry} from "../../components/product/PeopleCounter";

export const Route = createRoute('/product/select-spec', {
  validateParams: (params) => params,
  component: ProductSelectSpec,
});

const QUERY_PACKAGE_API = `${import.meta.env.API_ROUTE_RELEASE}/kkday/Product/QueryPackage`;

function ProductSelectSpec() {
  const params = Route.useParams();
  console.log(params);

  return (
    <View>
      <Text>Hello ProductSelectSpec</Text>
    </View>
  );
}
