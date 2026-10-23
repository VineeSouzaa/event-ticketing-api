import { stopAll } from './containers';

export default async function globalTeardown() {
  await stopAll();
}
