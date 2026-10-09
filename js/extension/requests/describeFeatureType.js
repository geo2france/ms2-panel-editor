import { describeFeatureType } from "@mapstore/api/WFS";

export const getDescribeFeatureType = (url, typeName) => describeFeatureType(url, typeName);
