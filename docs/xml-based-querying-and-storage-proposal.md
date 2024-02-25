
# Proposal to use XML-based querying and storage for BaseTerm

## Motivation

### Performance

The primary goal of moving to use XML-based storage and querying of TBX data is to increase performance.

#### Current setup

- Create PostgreSQL (PG) schemas and tables based on entities derived from TBX.
- Parse uploaded TBX files and store data within PG tables.
- Export TBX files by collating data from tables.

#### Concerns

- Slow performance for import and export of large TBX files.
- Need for BYU TRG team to maintain a complex collection of PG schema and table definitions.

## Proposed Design

PG supports the [XML](https://www.postgresql.org/docs/9.1/datatype-xml.html) datatype, which can allow us to take advantage of [XPath](https://www.postgresql.org/docs/current/functions-xml.html#FUNCTIONS-XML-PROCESSING) querying and indexing. We can structure our PG database and API like so: 

- Store TBX files in one table, using the XML datatype. 
- Setup [XPath-based indices](https://stackoverflow.com/questions/52173921/how-to-create-an-index-on-an-xml-column-in-postgresql-with-an-xpath-expression) on frequently queried entities, such as concept entry, language section, term, and ref object.
- Migrate API to query data using XPath queries.
- Migrate API to import and export TBX files in a single query, removing the need for [TBX Consumer](https://github.com/BYU-TRG-Team/baseterm-api/blob/main/src/support/tbx-consumer.ts), [TBX Constructor](https://github.com/BYU-TRG-Team/baseterm-api/blob/main/src/support/tbx-constructor.ts), and [SSE logic](https://github.com/BYU-TRG-Team/baseterm-api/blob/main/src/controllers/file-service/session.ts).
