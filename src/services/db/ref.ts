/* eslint-disable @typescript-eslint/no-explicit-any */
import { Knex } from "knex";
import  * as dbTypes from "@db/types";
import * as tables from "@db/tables";
import * as types from "@typings";
import Helpers from "@helpers";
import { TbxEntity } from "@db/classes";
import { UUID } from "@typings";
import { v4 as uuid } from "uuid";

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

  private async retrieveBack(
    termbaseUUID: UUID,
    dbClient: types.DBClient
  ) {
    const back = this.helpers.pluckOne(
      await dbClient<dbTypes.Back>(tables.backTable.fullTableName)
        .where({
          termbase_uuid: termbaseUUID,
        })
        .select("*")
    );

    if (back !== null) {
      return back;
    }

    const newBack = this.helpers.pluckOne(
      await dbClient<dbTypes.Back>(tables.backTable.fullTableName)
        .insert({
          termbase_uuid: termbaseUUID,
        })
        .returning<dbTypes.Back[]>("*")
    ) as dbTypes.Back;

    return newBack;
  }

  private async retrieveRefObjectSec(
    termbaseUUID: UUID,
    type: string,
    dbClient: types.DBClient
  ) {
    await this.retrieveBack(
      termbaseUUID,
      dbClient
    );

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
  ): Promise<types.PersonRefObjectPreview[]> {
    const formattedPersonRefs: types.PersonRefObjectPreview[] = []; 

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

  public async retrievePersonRef(
    termbaseUUID: UUID,
    personId: string,
    dbClient: types.DBClient = this.dbClient,
  ): Promise<null | types.PersonRefObject> {
    const personRef = this.helpers.pluckOne(
      await dbClient<dbTypes.RefObject>(tables.refObjectTable.fullTableName)
        .where({
          termbase_uuid: termbaseUUID,
          id: personId,
        })
        .select("*")
    );

    if (personRef === null) {
      return null;
    }

    const refEntity = new TbxEntity({
      ...tables.refObjectTable,
      uuid: personRef.uuid,
    });

    const personRefObject: types.PersonRefObject = {
      fullName: "",
      email: "",
      role: "",
      uuid: refEntity.uuid,
      rawId: personId,
      id: this.convertPersonIdToUUID(
        personId
      ),
      source: "External"
    }; 

    const items = await this.helpers.getChildTables<dbTypes.Item>(
      refEntity,
      tables.itemTable,
      dbClient      
    );

    for (const item of items) {
      switch(item.type) {
      case "fn":
        personRefObject.fullName = item.value;
        break;
          
      case "email":
        personRefObject.email = item.value;
        break;

      case "role":
        personRefObject.role = item.value;
        break;

      case "source":
        personRefObject.source = 
              item.value === "BaseTerm" ?
                "BaseTerm" :
                "External";
        break;

      }
    }

    return personRefObject;
  }
}

export default RefService;