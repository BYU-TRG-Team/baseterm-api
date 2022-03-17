// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PgLiteral } = require("node-pg-migrate");

const termbaseSchema = "termbase";
const termbaseHeaderSchema = "termbase_header";
const termbaseTextSchema = "termbase_text";
const termbaseAuxSchema = "termbase_aux";


/*
* Top Level
*/

const baseTable = { schema: termbaseSchema, name: "base" }; 
const idTable = { schema: termbaseSchema, name: "id" };


/*
* Header
*/

const headerTable = { schema: termbaseHeaderSchema, name: "header" };
const encodingDescTable = { schema: termbaseHeaderSchema, name: "encoding_desc" };
const revisionDescTable = { schema: termbaseHeaderSchema, name: "revision_desc" };
const fileDescTable = { schema: termbaseHeaderSchema, name: "file_desc" };
const revisionDescChangeTable = { schema: termbaseHeaderSchema, name: "revision_desc_change" };
const publicationStmtTable = { schema: termbaseHeaderSchema, name: "publication_stmt" };
const sourceDescTable = { schema: termbaseHeaderSchema, name: "source_desc"};
const titleTable = { schema: termbaseHeaderSchema, name: "title"};
const headerNoteTable = { schema: termbaseHeaderSchema, name: "header_note" };

/*
/* Auxiliary 
*/
const adminTable = { schema: termbaseAuxSchema, name: "admin" };
const descripTable = { schema: termbaseAuxSchema, name: "descrip" };
const transacTable = { schema: termbaseAuxSchema, name: "transac" };
const xrefTable = { schema: termbaseAuxSchema, name: "xref" };
const refTable = { schema: termbaseAuxSchema, name: "ref" };
const dateTable = { schema: termbaseAuxSchema, name: "date" };
const auxNoteTable = { schema: termbaseAuxSchema, name: "aux_note" };

/*
* Text
*/

const textTable = { schema: termbaseTextSchema, name: "text" };
const bodyTable = { schema: termbaseTextSchema, name: "body" };
const conceptEntryTable = { schema: termbaseTextSchema, name: "concept_entry" };
const langSecTable = { schema: termbaseTextSchema, name: "lang_sec" };
const termNoteTable = { schema: termbaseTextSchema, name: "term_note" };
const termTable = { schema: termbaseTextSchema, name: "term" };
const backTable = { schema: termbaseTextSchema, name: "back" };
const refObjectSecTable = { schema: termbaseTextSchema, name: "ref_object_sec" };
const refObjectTable = { schema: termbaseTextSchema, name: "ref_object" };
const itemSetTable = { schema: termbaseTextSchema, name: "item_set" };
const itemTable = { schema: termbaseTextSchema, name: "item" };

/*
* Helpers
*/

const createRelationalTables = (parentTable, children) => {
  const tables = [];
  children.forEach((childTable) => {
    tables.push({ schema: parentTable.schema, name: `${parentTable.name}_${childTable.name}`});
  });

  return tables;
};

const createAuxInfoTables = (parentTable) => {
  const auxTables = [adminTable, descripTable, auxNoteTable, refTable, transacTable, xrefTable];
  return createRelationalTables(parentTable, auxTables);
};

const createNoteLinkInfoTables = (parentTable) => {
  const auxTables = [adminTable, auxNoteTable, refTable, transacTable, xrefTable];
  return createRelationalTables(parentTable, auxTables);
}; 

const constructRelationalTables = (pgm, parentTable, children) => {
  children.forEach((childTable) => {
    const newParentAuxRelTable =  { schema: parentTable.schema, name: `${parentTable.name}_${childTable.name}`};
   
    pgm.createTable(
      newParentAuxRelTable,
      {
        [`${parentTable.name}_uuid`]: {
          type: "uuid",
          notNull: true,
        },
        [`${childTable.name}_uuid`]: {
          type: "uuid",
          notNull: true,
        }
      },
      {
        ifNotExists: true,
      }
    );
  
    pgm.addConstraint(newParentAuxRelTable, `primary_key_${newParentAuxRelTable.name}_table`, {
      primaryKey: [`${parentTable.name}_uuid`, `${childTable.name}_uuid`],
    });
  
    pgm.addConstraint(newParentAuxRelTable, `foreign_ref_${newParentAuxRelTable.name}_table_${parentTable.name}_uuid_col`, {
      foreignKeys: {
        columns: `${parentTable.name}_uuid`,
        references: `${parentTable.schema}.${parentTable.name} (uuid)`,
        onDelete: "CASCADE",
      }
    });
  
    pgm.addConstraint(newParentAuxRelTable, `foreign_ref_${newParentAuxRelTable.name}_table_${childTable.name}_uuid_col`, {
      foreignKeys: {
        columns: `${childTable.name}_uuid`,
        references: `${childTable.schema}.${childTable.name} (uuid)`,
        onDelete: "CASCADE",
      }
    });
  });
};

// Can ony be called once all aux tables are created
const constructAuxInfoTables = (pgm, parentTable) => {
  const auxTables = [adminTable, descripTable, auxNoteTable, refTable, transacTable, xrefTable];
  constructRelationalTables(pgm, parentTable, auxTables);
};

// Can ony be called once all aux tables are created
const constructNoteLinkInfoTables = (pgm, parentTable) => {
  const auxTables = [adminTable, auxNoteTable, refTable, transacTable, xrefTable];
  constructRelationalTables(pgm, parentTable, auxTables);
};

exports.up = (pgm) => {
  pgm.createExtension("uuid-ossp", { ifNotExists: true });
  
  pgm.createSchema(termbaseSchema, {
    ifNotExists: true
  });

  pgm.createSchema(termbaseHeaderSchema, {
    ifNotExists: true
  });

  pgm.createSchema(termbaseTextSchema, {
    ifNotExists: true
  });

  pgm.createSchema(termbaseAuxSchema, {
    ifNotExists: true
  });
  
  /*
  * Top-Level 
  */

  // base
  pgm.createTable(
    baseTable,
    {
      termbase_uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      type: { 
        type: "varchar", 
        notNull: true 
      },
      style: { 
        type: "varchar", 
        notNull: true,
      },
      xml_lang: { 
        type: "varchar", 
        notNull: true 
      },
      xmlns: {
        type: "varchar",
        notNull: true,
      },
      name: {
        type: "varchar",
        notNull: true,
        unique: true,
      },
      enforce_basic_dialect: {
        type: "boolean",
        notNull: true,
        default: true,
      }
    },
    {
      ifNotExists: true,
    }
  );

  /*
  * id
  *
  * Most elements in the TBX XML tree have an optional id attribute. 
  * A few other elements in the tree have an optional ref attribute, which serves as a pointer reference
  * to the id attribute of another element in the tree. 
  * 
  * Keeping these in a table in order to enforce integrity of the 
  * ref column, and to serve as an optimized way of resolving these relations.
  * 
  */
  pgm.createTable(
    idTable,
    {
      id: { 
        type: "varchar",
        notNull: true,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
      entity_table: { 
        type: "varchar", 
        notNull: true,
      },
      entity_uuid: { 
        type: "uuid",
        notNull: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(idTable, "primary_key_id_table", {
    primaryKey: ["id", "termbase_uuid"],
  });

  /*
  * Header Tables
  */

  // header
  pgm.createTable(
    headerTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: { 
        type: "varchar", 
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
        unique: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(headerTable, "foreign_ref_header_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // header_note
  pgm.createTable(
    headerNoteTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: { 
        type: "varchar", 
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
      xml_lang: {
        type: "varchar",
        notNull: false,
      },
      type: {
        type: "varchar",
        notNull: false,
      },
      value: { 
        type: "varchar",
        notNull: true,
      },
      order: {
        type: "integer",
        notNull: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(headerNoteTable, "foreign_ref_header_note_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // encoding_desc 
  pgm.createTable(
    encodingDescTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: { 
        type: "varchar", 
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
        unique: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(encodingDescTable, "foreign_ref_encoding_desc_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // encoding_desc_header_note
  constructRelationalTables(pgm, encodingDescTable, [headerNoteTable]);

  // revision_desc
  pgm.createTable(
    revisionDescTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      xml_lang: {
        type: "varchar",
        notNull: false,
      },
      id: { 
        type: "varchar", 
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
        unique: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(revisionDescTable, "foreign_ref_revision_desc_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // file_desc
  pgm.createTable(
    fileDescTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: { 
        type: "varchar", 
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
        unique: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(fileDescTable, "foreign_ref_file_desc_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // revision_desc_change
  pgm.createTable(
    revisionDescChangeTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      order: {
        type: "integer",
        notNull: true,
      },
      xml_lang: {
        type: "varchar",
        notNull: false,
      },
      id: { 
        type: "varchar", 
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(revisionDescChangeTable, "foreign_ref_revision_desc_change_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // revision_desc_change_header_note
  constructRelationalTables(pgm, revisionDescChangeTable, [headerNoteTable]);

  // publication_stmt
  pgm.createTable(
    publicationStmtTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: { 
        type: "varchar", 
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
        unique: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(publicationStmtTable, "foreign_ref_publication_stmt_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // publication_stmt_header_note
  constructRelationalTables(pgm, publicationStmtTable, [headerNoteTable]);
  
  // source_desc
  pgm.createTable(
    sourceDescTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      xml_lang: {
        type: "varchar",
        notNull: false,
      },
      id: { 
        type: "varchar", 
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
        unique: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(sourceDescTable, "foreign_ref_source_desc_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // source_desc_header_note
  constructRelationalTables(pgm, sourceDescTable, [headerNoteTable]);

  // title
  pgm.createTable(
    titleTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      xml_lang: {
        type: "varchar",
        notNull: false,
      },
      id: {
        type: "varchar",
        notNull: false
      },
      statement_xml_lang: {
        type: "varchar",
        notNull: false,
      },
      statement_id: { 
        type: "varchar", 
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
        unique: true,
      },
      value: {
        type: "varchar",
        notNull: true,
      }
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(titleTable, "foreign_ref_title_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  pgm.addConstraint(titleTable, "foreign_ref_title_table_statement_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["statement_id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // title_header_note
  constructRelationalTables(pgm, titleTable, [headerNoteTable]);

  /*
  * Aux Tables
  */

  // admin
  pgm.createTable(
    adminTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: { 
        type: "varchar", 
        notNull: false,
      },
      target: {
        type: "varchar",
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
      xml_lang: {
        type: "varchar",
        notNull: false,
      },
      datatype: { 
        type: "varchar", 
        notNull: false,
      },
      type: {
        type: "varchar",
        notNull: true,
      },
      is_admin_grp: {
        type: "boolean",
        notNull: true,
        default: false,
      },
      admin_grp_id: {
        type: "varchar", 
        notNull: false,
      },
      value: { 
        type: "varchar",
        notNull: true,
      },
      order: {
        type: "integer",
        notNull: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(adminTable, "foreign_ref_admin_table_target_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["target", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  pgm.addConstraint(adminTable, "foreign_ref_admin_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  pgm.addConstraint(adminTable, "foreign_ref_admin_table_admin_grp_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["admin_grp_id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // descrip
  pgm.createTable(
    descripTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      xml_lang: {
        type: "varchar",
        notNull: false,
      },
      id: { 
        type: "varchar", 
        notNull: false,
      },
      target: {
        type: "varchar",
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
      datatype: { 
        type: "varchar", 
        notNull: false,
      },
      type: {
        type: "varchar",
        notNull: true,
      },
      is_descrip_grp: {
        type: "boolean",
        notNull: true,
        default: false,
      },
      descrip_grp_id: {
        type: "varchar", 
        notNull: false,
      },
      value: { 
        type: "varchar",
        notNull: true,
      },
      order: {
        type: "integer",
        notNull: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(descripTable, "foreign_ref_descrip_table_target_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["target", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  pgm.addConstraint(descripTable, "foreign_ref_descrip_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  pgm.addConstraint(descripTable, "foreign_ref_descrip_table_descrip_grp_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["descrip_grp_id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // transac
  pgm.createTable(
    transacTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      xml_lang: {
        type: "varchar",
        notNull: false,
      },
      target: {
        type: "varchar",
        notNull: false,
      },
      id: { 
        type: "varchar", 
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
      datatype: { 
        type: "varchar", 
        notNull: false,
      },
      type: {
        type: "varchar",
        notNull: true,
      },
      is_transac_grp: {
        type: "boolean",
        notNull: true,
        default: false,
      },
      transac_grp_id: {
        type: "varchar", 
        notNull: false,
      },
      value: { 
        type: "varchar",
        notNull: true,
      },
      order: {
        type: "integer",
        notNull: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(transacTable, "foreign_ref_transac_table_target_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["target", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  pgm.addConstraint(transacTable, "foreign_ref_transac_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  pgm.addConstraint(transacTable, "foreign_ref_transac_table_transac_grp_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["transac_grp_id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // xref 
  pgm.createTable(
    xrefTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: { 
        type: "varchar", 
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
      target: { 
        type: "varchar", 
        notNull: true,
      },
      type: { 
        type: "varchar", 
        notNull: true,
      },
      value: { 
        type: "varchar",
        notNull: true,
      },
      order: {
        type: "integer",
        notNull: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(xrefTable, "foreign_ref_xref_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // ref
  pgm.createTable(
    refTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: { 
        type: "varchar", 
        notNull: false,
      },
      target: { 
        type: "varchar", 
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
      xml_lang: {
        type: "varchar",
        notNull: false,
      },
      datatype: { 
        type: "varchar", 
        notNull: false,
      },
      type: { 
        type: "varchar", 
        notNull: true,
      },
      value: { 
        type: "varchar",
        notNull: true,
      },
      order: {
        type: "integer",
        notNull: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(refTable, "foreign_ref_ref_table_target_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["target", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  pgm.addConstraint(refTable, "foreign_ref_ref_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // date
  pgm.createTable(
    dateTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: { 
        type: "varchar", 
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
      value: { 
        type: "varchar",
        notNull: true,
      },
      order: {
        type: "integer",
        notNull: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(dateTable, "foreign_ref_date_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // aux_note
  pgm.createTable(
    auxNoteTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: { 
        type: "varchar", 
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
      target: {
        type: "varchar",
        notNull: false,
      },
      xml_lang: {
        type: "varchar",
        notNull: false,
      },
      type: {
        type: "varchar",
        notNull: false,
      },
      is_generic_note: {
        type: "varchar",
        notNull: true,
        default: true,
      },
      value: { 
        type: "varchar",
        notNull: true,
      },
      order: {
        type: "integer",
        notNull: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(auxNoteTable, "foreign_ref_aux_note_table_target_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["target", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  pgm.addConstraint(auxNoteTable, "foreign_ref_aux_note_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // descrip_admin, descrip_aux_note, descrip_ref, descrip_xref, descrip_transac
  constructRelationalTables(pgm, descripTable, [adminTable, auxNoteTable, refTable, xrefTable, transacTable]);
  // transac_date, transac_aux_note, transac_ref, transac_xref
  constructRelationalTables(pgm, transacTable, [dateTable, auxNoteTable, refTable, xrefTable]);
  // admin_aux_note, admin_ref, admin_xref
  constructRelationalTables(pgm, adminTable, [auxNoteTable, refTable, xrefTable]);

  /*
  * Text Tables
  */

  // text
  pgm.createTable(
    textTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: {
        type: "varchar",
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
        unique: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(textTable, "foreign_ref_text_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // body
  pgm.createTable(
    bodyTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: {
        type: "varchar",
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
        unique: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(bodyTable, "foreign_ref_body_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // term_note
  pgm.createTable(
    termNoteTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      xml_lang: {
        type: "varchar",
        notNull: false,
      },
      target: {
        type: "varchar",
        notNull: false,
      },
      id: { 
        type: "varchar", 
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
      datatype: { 
        type: "varchar", 
        notNull: false,
      },
      type: {
        type: "varchar",
        notNull: true,
      },
      is_term_note_grp: {
        type: "boolean",
        notNull: true,
        default: false,
      },
      term_note_grp_id: {
        type: "varchar", 
        notNull: false,
      },
      value: { 
        type: "varchar",
        notNull: true,
      },
      order: {
        type: "integer",
        notNull: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(termNoteTable, "foreign_ref_term_note_table_target_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["target", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  pgm.addConstraint(termNoteTable, "foreign_ref_term_note_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  pgm.addConstraint(termNoteTable, "foreign_ref_term_note_table_term_note_grp_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["term_note_grp_id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  constructNoteLinkInfoTables(pgm, termNoteTable);

  // term
  pgm.createTable(
    termTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: { 
        type: "varchar", 
        notNull: false,
      },
      term_sec_id: {
        type: "varchar",
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
      value: { 
        type: "varchar",
        notNull: true,
      },
      order: {
        type: "integer",
        notNull: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(termTable, "foreign_ref_term_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  pgm.addConstraint(termTable, "foreign_ref_term_table_term_sec_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["term_sec_id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  constructAuxInfoTables(pgm, termTable);

  // term_term_note
  constructRelationalTables(pgm, termTable, [termNoteTable]);

  // lang_sec
  pgm.createTable(
    langSecTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },  
      xml_lang: {
        type: "varchar",
        notNull: true,
      },
      order: {
        type: "integer",
        notNull: true,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
    },
    {
      ifNotExists: true,
    }
  );

  constructAuxInfoTables(pgm, langSecTable);

  // lang_sec_term
  constructRelationalTables(pgm, langSecTable, [termTable]);

  // concept_entry
  pgm.createTable(
    conceptEntryTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: {
        type: "varchar",
        notNull: true,
        check: "length(id) > 0"
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
      order: {
        type: "integer",
        notNull: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(conceptEntryTable, "foreign_ref_concept_entry_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  constructAuxInfoTables(pgm, conceptEntryTable);

  // concept_entry_lang_sec
  constructRelationalTables(pgm, conceptEntryTable, [langSecTable]);

  // back
  pgm.createTable(
    backTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: {
        type: "varchar",
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(backTable, "foreign_ref_back_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // item
  pgm.createTable(
    itemTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: {
        type: "varchar",
        notNull: false,
      },
      type: {
        type: "varchar",
        notNull: false,
      },
      item_grp_id: {
        type: "varchar",
        notNull: false,
      },
      is_item_grp: {
        type: "boolean",
        notNull: true,
        default: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
      value: {
        type: "varchar",
        notNull: true,
      },
      order: {
        type: "integer",
        notNull: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(itemTable, "foreign_ref_item_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  pgm.addConstraint(itemTable, "foreign_ref_item_table_item_grp_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["item_grp_id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  constructNoteLinkInfoTables(pgm, itemTable);

  // item_set
  pgm.createTable(
    itemSetTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: {
        type: "varchar",  
        notNull: false,
      },
      type: {
        type: "varchar",
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
      order: {
        type: "integer",
        notNull: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(itemSetTable, "foreign_ref_item_set_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });
  
  // item_set_item
  constructRelationalTables(pgm, itemSetTable, [itemTable]);

  // ref_object
  pgm.createTable(
    refObjectTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      id: {
        type: "varchar",
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
      order: {
        type: "integer",
        notNull: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(refObjectTable, "foreign_ref_ref_object_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // ref_object_item_set, ref_object_item
  constructRelationalTables(pgm, refObjectTable, [itemSetTable, itemTable]);

  // ref_object_sec
  pgm.createTable(
    refObjectSecTable,
    {
      uuid: { 
        type: "uuid",
        default: new PgLiteral("uuid_generate_v4()"),
        notNull: true,
        primaryKey: true,
      },
      type: {
        type: "varchar",
        notNull: true,
      },
      id: {
        type: "varchar",
        notNull: false,
      },
      termbase_uuid: { 
        type: "uuid",
        notNull: true,
        references: baseTable,
        onDelete: "CASCADE",
      },
      order: {
        type: "integer",
        notNull: true,
      },
    },
    {
      ifNotExists: true,
    }
  );

  pgm.addConstraint(refObjectSecTable, "foreign_ref_ref_object_sec_table_id_col_termbase_uuid_col", {
    foreignKeys: {
      columns: ["id", "termbase_uuid"],
      references: `${termbaseSchema}.id (id, termbase_uuid)`,
      onDelete: "CASCADE",
    }
  });

  // ref_object_sec_ref_object
  constructRelationalTables(pgm, refObjectSecTable, [refObjectTable]);
};



exports.down = (pgm) => {
  
  
  createRelationalTables(refObjectSecTable, [refObjectTable]).forEach(pgm.dropTable);
  pgm.dropTable(refObjectSecTable);

  createRelationalTables(refObjectTable, [itemSetTable, itemTable]).forEach(pgm.dropTable);
  pgm.dropTable(refObjectTable);

  createRelationalTables(itemSetTable, [itemTable]).forEach(pgm.dropTable);
  pgm.dropTable(itemSetTable);

  createNoteLinkInfoTables(itemTable).forEach(pgm.dropTable);
  pgm.dropTable(itemTable);

  pgm.dropTable(backTable); // references id table, base table

  createRelationalTables(conceptEntryTable, [langSecTable]).forEach(pgm.dropTable);
  createAuxInfoTables(conceptEntryTable).forEach(pgm.dropTable);
  pgm.dropTable(conceptEntryTable);// references id table, base table 

  createRelationalTables(langSecTable, [termTable]).forEach(pgm.dropTable);
  createAuxInfoTables(langSecTable).forEach(pgm.dropTable);
  pgm.dropTable(langSecTable);

  createRelationalTables(termTable, [termNoteTable]).forEach(pgm.dropTable);
  createAuxInfoTables(termTable).forEach(pgm.dropTable);
  pgm.dropTable(termTable); // references id table, base table

  createNoteLinkInfoTables(termNoteTable).forEach(pgm.dropTable);
  pgm.dropTable(termNoteTable); // references id table, base table 
 
  pgm.dropTable(bodyTable); // references id table, base table 
  pgm.dropTable(textTable); // references id table, base table 

  createRelationalTables(adminTable, [auxNoteTable, refTable, xrefTable]).forEach(pgm.dropTable);
  createRelationalTables(transacTable, [dateTable, auxNoteTable, refTable, xrefTable]).forEach(pgm.dropTable);
  createRelationalTables(descripTable, [adminTable, auxNoteTable, refTable, xrefTable, transacTable]).forEach(pgm.dropTable);

  pgm.dropTable(auxNoteTable); // references id table, base table 
  pgm.dropTable(dateTable); // references id table, base table 
  pgm.dropTable(refTable); // references id table, base table 
  pgm.dropTable(xrefTable); // references id table, base table 
  pgm.dropTable(transacTable); //references id table, base table 
  pgm.dropTable(descripTable); // references id table, base table 
  pgm.dropTable(adminTable); // references id table, base table 

  createRelationalTables(titleTable, [headerNoteTable]).forEach(pgm.dropTable);
  pgm.dropTable(titleTable); // references id table, base table 

  createRelationalTables(sourceDescTable, [headerNoteTable]).forEach(pgm.dropTable);
  pgm.dropTable(sourceDescTable); // references id table, base table 
  
  createRelationalTables(publicationStmtTable, [headerNoteTable]).forEach(pgm.dropTable);
  pgm.dropTable(publicationStmtTable); // references id table, base table 
  
  createRelationalTables(revisionDescChangeTable, [headerNoteTable]).forEach(pgm.dropTable);
  pgm.dropTable(revisionDescChangeTable); // references id table, base table 
  
  pgm.dropTable(fileDescTable); // references id table, base table 
  pgm.dropTable(revisionDescTable); // references id table, base table 
  
  createRelationalTables(encodingDescTable, [headerNoteTable]).forEach(pgm.dropTable);
  pgm.dropTable(encodingDescTable); // references id table, base table 
  
  pgm.dropTable(headerNoteTable);  // references id table, base table 
  pgm.dropTable(headerTable); // references id table, base table 
  pgm.dropTable(idTable);
  pgm.dropTable(baseTable);

  pgm.dropSchema(termbaseAuxSchema);
  pgm.dropSchema(termbaseTextSchema);
  pgm.dropSchema(termbaseHeaderSchema);
  pgm.dropSchema(termbaseSchema);
};