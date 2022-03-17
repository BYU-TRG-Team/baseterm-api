/* eslint-disable @typescript-eslint/no-explicit-any */
import { Knex } from "knex";
import  * as dbTypes from "../db/types";
import * as tables from "../db/tables";
import * as types from "../types";
import Helpers from "../helpers";
import { TbxEntity } from "../db/classes";
import { UUID } from "../types";
import { uuid } from "uuidv4";

interface PersonRefConfig {
  name: string,
  email: string,
  role: string,
  id: UUID,
}

class RefService {
  private dbClient: Knex<any, unknown[]>;
  private helpers: Helpers;
 
  constructor(
    dbClient: Knex<any, unknown[]>,
    helpers: Helpers,
  ) {
    this.dbClient = dbClient;
    this.helpers = helpers;
  }

  private formatPersonID(
    id: UUID
  ) {
    return `BT-${id}`;
  }

  private convertPersonIdToUUID(
    personId: string
  ) {
    return personId.substring(3);
  }

  private async retrieveRefObjectSec(
    termbaseUUID: UUID,
    type: string,
    dbClient: types.DBClient
  ) {
    const refObjectSec = this.helpers.pluckOne(
      await dbClient<dbTypes.RefObjectSec>(tables.refObjectSecTable.fullTableName)
        .where({
          type,
          termbase_uuid: termbaseUUID,
        })
        .select("*")
    );

    if (refObjectSec !== null) {
      return refObjectSec;
    }

    const newRefObjectSec =  
      this.helpers.pluckOne(
        await dbClient<dbTypes.RefObjectSec>(tables.refObjectSecTable.fullTableName)
          .insert({
            termbase_uuid: termbaseUUID,
            type,
            order: await this.helpers.computeNextOrder(
              termbaseUUID,
              tables.refObjectSecTable,
              dbClient
            )
          })
          .returning<dbTypes.RefObjectSec[]>("*")
      ) as dbTypes.RefObjectSec;

    return newRefObjectSec;
  }

  public async constructPersonRef(
    termbaseUUID: UUID,
    dbClient: types.DBClient,
    {
      name,
      email,
      role,
      id,
    }: PersonRefConfig,
  ): Promise<UUID> {
    const formattedPersonId = this.formatPersonID(
      id
    );

    const refObjectSec = await this.retrieveRefObjectSec(
      termbaseUUID,
      "respPerson",
      dbClient
    );

    const refObjectSecEntity = new TbxEntity({
      ...tables.refObjectSecTable,
      uuid: refObjectSec.uuid,
    });

    const refObjectEntity = new TbxEntity({
      ...tables.refObjectTable,
      uuid: uuid(),
    });

    await this.helpers.saveId(
      formattedPersonId,
      termbaseUUID,
      refObjectEntity,
      dbClient
    );
  
    await dbClient<dbTypes.RefObject>(tables.refObjectTable.fullTableName)
      .insert({
        uuid: refObjectEntity.uuid,
        termbase_uuid: termbaseUUID,
        id: formattedPersonId,
        order: await this.helpers.computeNestedNextOrder(
          refObjectSecEntity,
          tables.refObjectTable,
          dbClient
        )
      });

    await this.helpers.saveChildTable(
      refObjectSecEntity,
      refObjectEntity,
      dbClient
    );

    for (const item of 
    [
      { type: "fn", value: name },
      { type: "email", value: email },
      { type: "role", value: role },
      { type: "source", value: "BaseTerm" }
    ]) {
      const itemEntity = new TbxEntity({
        ...tables.itemTable,
        uuid: uuid()
      });

      await dbClient<dbTypes.Item>(tables.itemTable.fullTableName)
        .insert({
          uuid: itemEntity.uuid,
          termbase_uuid: termbaseUUID,
          type: item.type,
          value: item.value,
          order: await this.helpers.computeNestedNextOrder(
            refObjectEntity,
            tables.itemTable,
            dbClient
          )
        });

      await this.helpers.saveChildTable(
        refObjectEntity,
        itemEntity,
        dbClient
      );
    } 

    return refObjectEntity.uuid;
  }  

  public async retrievePersonRefs(
    termbaseUUID: UUID,
    dbClient: types.DBClient = this.dbClient,
  ): Promise<types.PersonRefObject[]> {
    const formattedPersonRefs: types.PersonRefObject[] = []; 

    const refObjectSec = await this.retrieveRefObjectSec(
      termbaseUUID,
      "respPerson",
      dbClient
    );

    const refObjectSecEntity = new TbxEntity({
      ...tables.refObjectSecTable,
      uuid: refObjectSec.uuid,
    });

    const personRefs = await this.helpers.getChildTables<dbTypes.RefObject>(
      refObjectSecEntity,
      tables.refObjectTable,
      dbClient
    );    

    for (let i = 0; i < personRefs.length; ++i) {
      const personRef = personRefs[i];
      const personRefEntity = new TbxEntity({
        ...tables.refObjectTable,
        uuid: personRef.uuid,
      });

      const sourceItem = this.helpers.pluckOne(
        await this.helpers.getChildTables<dbTypes.Item>(
          personRefEntity,
          tables.itemTable,
          dbClient,
          {
            "type": "source"
          }
        )
      );

      const isExternal = sourceItem === null || sourceItem.value !== "BaseTerm";

      formattedPersonRefs.push({
        uuid: personRef.uuid,
        id: (
          isExternal ?
          personRef.id || "" :
          this.convertPersonIdToUUID(
            personRef.id as string
          )
        ),
        source: (
          isExternal ?
          "External" :
          "BaseTerm"
        )
      });
    }

    return formattedPersonRefs;
  }
}

export default RefService;