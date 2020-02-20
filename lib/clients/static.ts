import axios from 'axios';

const Static = {
  axios,
} as const;

export type StaticType = typeof Static;

export default Static;
