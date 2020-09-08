import axios from 'axios';
import fs from 'fs';
import path from 'path';

const Static = {
  axios,
  fs,
  path,
} as const;

export type StaticType = typeof Static;

export default Static;
