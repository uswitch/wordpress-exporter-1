import path from 'path';
import fs from 'fs-extra';
import { client } from '../contentful';
import logger from '../logger';

const SPACE_CONFIG_DIR = path.resolve(process.cwd(), '.wordpress-exporter', 'spaces');
const SPACE_CONFIG_FILE = (site, lang) => `${site}-${lang}.json`;

export const command = 'space <cmd>';
export const describe = 'Manage Contentful spaces';
export function builder(yargs) {
  return yargs
    .command({
      command: 'create',
      describe: 'Create a Contentful space for given lang and site',
      handler: async ({ site, lang }) => {
        try {
          const configFile = path.join(SPACE_CONFIG_DIR, SPACE_CONFIG_FILE(site, lang));

          if (!fs.pathExistsSync(configFile)) {
            // Ensure space config dir exists
            await fs.mkdirs(SPACE_CONFIG_DIR);

            // Create space
            const space = await client.createSpace({
              name: `${site}/${lang}`,
              defaultLocale: lang,
            });
            fs.writeJson(configFile, {
              id: space.sys.id,
              name: space.name,
              lang,
            });

            logger.info(`Created space ${space.sys.id} for site ${site} and lang ${lang}`);
          } else {
            logger.error(`Space already exists for site ${site} and lang ${lang}`);
          }
        } catch (error) {
          logger.error(error);
        }
      },
    })
    .command({
      command: 'delete',
      describe: 'Delete the Contentful space for given lang and site',
      handler: async ({ site, lang }) => {
        try {
          const configFile = path.join(SPACE_CONFIG_DIR, SPACE_CONFIG_FILE(site, lang));

          if (!fs.pathExistsSync(configFile)) {
            logger.error(`No space config found for site ${site} and lang ${lang}`);
          } else {
            const config = await fs.readJson(configFile);
            const space = await client.getSpace(config.id);

            await space.delete();
            fs.remove(configFile);
            logger.info(`Deleted space ${space.id} for site ${site} and lang ${lang}`);
          }
        } catch (error) {
          logger.error(error);
        }
      },
    });
}