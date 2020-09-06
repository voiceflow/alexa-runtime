import axios from 'axios';
import fs from 'fs';

const Static = {
  axios,
  fs,
} as const;

export type StaticType = typeof Static;

export default Static;
