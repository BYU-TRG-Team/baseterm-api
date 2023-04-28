# BaseTerm API

Express.js HTTP REST API and PostgreSQL schemas built for [TBX](www.tbxinfo.net) v3. The API currently supports only the TBX-Basic dialect. The API and PostgreSQL schemas are part of the [BaseTerm](https://github.com/BYU-TRG-Team/baseterm) web application.

## Installation

### Contact the BYU TRG
Before installing any instance of the BaseTerm API, please reach out to the BYU TRG at byutrg@gmail.com to establish a dialogue with the team. Please include any necessary contact info so that we can reach out to you for important version updates.

### Server Requirements

- PostgreSQL 14.x
- Node.js 16.x
- Python 3.9.x

### Setup NPM and a PostgreSQL instance

- NPM (Node Package Manager) will be needed for the installation of the BaseTerm API application. Please reference the [NPM documentation](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) for setup.
- A PostgreSQL instance will be needed for the BaseTerm API application. A database will also need to be created in the PostgreSQL instance. Please reference the [PostgreSQL downloads](https://www.postgresql.org/download/) for installers for various platforms.

### Third Party Requirements 

- **Rollbar logging token**.  Please contact the BYU TRG team to obtain this token.

### Environment Variables

```
APP_ENV=<dev | prod>
PORT=<port number>
DATABASE_URL=<url for the BaseTerm API database>
ROLLBAR_API_TOKEN=<Rollbar logging token>
AUTH_SECRET=<64-bit CSPRNG secret>
MAX_CONNECTION_POOL=<Max connections to pool for Postgres (default is 20)> *Not required*
```

### Build

```
npm ci
```

```
npm run build
```

```
pip3 install -r requirements.txt
```

### Database Configuration (PostgreSQL migrations)

**This step makes used of NPM packages installed from build.**

#### Migrate up
```
DATABASE_URL=<url for the BaseTerm API database> npm run migrate up
```

#### Migrate down
```
DATABASE_URL=<url for the BaseTerm API database> npm run migrate down
```

### Launch 

```
npm run start
```

### Development Mode
The launch script above will automatically restart the server on a rebuild. To trigger a rebuild everytime an edit is made, the following command can be run in a separate shell: 

```
npm run dev
```

## Schemas

### TbxElement

```
{
  Tbx = "tbx",
  TbxHeader = "tbxHeader",
  EncodingDesc = "encodingDesc",
  P = "p",
  RevisionDesc = "revisionDec",
  Change = "change",
  FileDesc = "fileDesc",
  PublicationStmt = "publicationStmt",
  SourceDesc = "sourceDesc",
  TitleStmt = "titleStmt",
  Title = "title",
  Note = "note",
  Text = "text",
  Body = "body",
  ConceptEntry = "conceptEntry",
  LangSec = "langSec",
  TermSec = "termSec",
  Term = "term",
  TermNoteGrp = "termNoteGrp",
  TermNote = "termNote",
  Back = "back",
  RefObjectSec = "refObjectSec",
  RefObject = "refObject",
  ItemSet = "itemSet",
  ItemGrp = "itemGrp",
  Item = "item",
  Admin = "admin",
  AdminGrp = "adminGrp",
  AdminNote = "adminNote",
  Descrip = "descrip",
  DescripGrp = "descripGrp",
  DescripNote = "descripNote",
  Date = "date",
  Ref = "ref",
  Transac = "transac",
  TransacGrp = "transacGrp",
  TransacNote = "transacNote",
  Xref = "xref",
}
```

### TbxAuxElement

```
TbxElement.Admin |
TbxElement.AdminGrp |
TbxElement.Descrip |
TbxElement.DescripGrp |
TbxElement.Transac |
TbxElement.TransacGrp |
TbxElement.Note |
TbxElement.Ref |
TbxElement.Xref |
TbxElement.Date |
TbxElement.AdminNote |
TbxElement.DescripNote |
TbxElement.TransacNote
```

### Termbase

```
{
  type: string;
  style: string;
  xmlns: string;
  name: string;
  termbaseUUID: UUID;
  xmlLang: string;
  enforceBasicDialect: boolean;
}
```

### TermPreview

```
{
  uuid: UUID;
  termSecId: NullableString;
  id: NullableString;
  value: string;
  language: string;
  termbaseUUID: UUID;
  order: number;
}
```

### TermPartialView

```
{
  synonyms: TermPreview[];
  translations: TermPreview[];
  conceptId: string;
  customers: string[];
  partOfSpeech: string;
  approvalStatus: string; 
  subjectField: string;
} & TermPreview
```

### TermFullView

```
{
  conceptEntry: ConceptEntryPreview;
  languageSection: LanguageSectionPreview;
  auxElements: AuxElement[];
  termNotes: TermNote[];
}
```

### ConceptEntryPreview

```
{
  uuid: UUID;
  id: string;
  termbaseUUID: string;
}
```

### ConceptEntry

```
{
  languageSections: LanguageSectionPreview[];
  auxElements: AuxElement[];
} & ConceptEntryPreview
```

### LanguageSectionPreview

```
{
  uuid: UUID;
  termbaseUUID: string;
  xmlLang: string;
  order: number;
}
```

### LanguageSection

```
{
  conceptEntry: ConceptEntryPreview;
  auxElements: AuxElement[];
  terms: TermPreview[];
} & LanguageSectionPreview
```

### AuxElement

```
{
  order: number;
  id?: NullableString;
  termbaseUUID?: UUID;
  target?: NullableString;
  xmlLang?: NullableString;
  datatype?: NullableString;
  type?: NullableString;
  auxElements?: AuxElement[];
  grpId?: NullableString;
  uuid: UUID;
  value: string;
  elementType: TbxAuxElement,
}
```

### TermNotePreview

```
{
  uuid: UUID;
  xmlLang: NullableString;
  target: NullableString;
  termbaseUUID: UUID;
  type: string;
  value: string;
  order: number;
  elementType: TbxElement.TermNote | TbxElement.TermNoteGrp
}
```

### TermNote

```
{
  id: NullableString;
  grpId: NullableString;
  datatype: NullableString;
  auxElements?: AuxElement[]
} & TermNotePreview
```


### PersonRefObjectPreview

```
{
  uuid: UUID,
  id: string,
  source: "BaseTerm" | "External"
}
```

## Endpoints
Parameters are required unless otherwise specified.

<br />

### File Services

---
<details>
  <summary>
    Validate
  </summary>

  #### URL
  /validate

  #### HTTP METHOD
  POST

  #### Params
  @tbxFile (FormData)

  #### Responses
  
  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Body Invalid"
  }
  ```

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "TBX File is invalid: 
    <error appended here>"
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: {
    tbx: TbxObject
  }
  ```
  #### Note

  An example of a TbxObject can be found [in the repository](https://github.com/BYU-TRG-Team/baseterm-api/blob/main/example-tbx/tbx-object.json).
</details>

---
<details>
  <summary>
    Import
  </summary>

  #### URL
  /import

  #### HTTP METHOD
  POST

  #### Allowed Roles
  Admin
  <br/>
  Staff

  #### Params
  @tbxFile (FormData)
  <br />
  @name
  <br />

  #### Responses
  
  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Body Invalid"
  }
  ```

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "TBX File is invalid: 
    <error appended here>"
  }
  ```

  ```
  Status Code: 202 (Accepted)

  Body: {
    sessionId: UUID,
    termbaseUUID: UUID,
  }
  ```

  #### Note
  The import endpoint launches a session. To subscribe to the session that is launched, the **sessionId** will need to be used with the **session endpoint**. 
</details>

---

<details>
  <summary>
    Export
  </summary>

  #### URL
  /export/***:termbaseUUID***

  #### HTTP METHOD
  GET

  #### Allowed Roles
  Admin
  <br/>
  Staff

  #### Responses
  
  ```
  Status Code: 404 (Not Found)

  Body: {
    error: "Resource not found"
  }
  ```

  ```
  Status Code: 202 (Accepted)

  Body: {
    sessionId: UUID,
  }
  ```

  #### Note
  The export endpoint launches a session. To subscribe to the session that is launched, the **sessionId** will need to be used with the **session endpoint** via HTTP SSE.
</details>

---

<details>
  <summary>
    Session
  </summary>

  #### URL
  /session/***:sessionId***

  #### HTTP METHOD
  GET

  #### Allowed Roles
  Admin
  <br/>
  Staff

  #### Response Schema
  
  ```
  {
    type?: "import" | "export",
    status?: "in progress" | "completed",
    conceptEntryNumber?: number;
    conceptEntryCount?: number;
    data?: string;
    error?: string;
    errorCode?: number;
  }
  ```

  #### Note
  The session endpoint utilizes Server-Side Events (SSE), so the client will have to subscribe to the endpoint using [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource/EventSource). 
</details>

---

<br />

### Termbase

---

<details>
  <summary>
    Get Termbase
  </summary>

  #### URL
  /termbase/***:termbaseUUID***

  #### HTTP METHOD
  GET

  #### Allowed Roles
  Admin
  <br />
  Staff
  <br />
  User

  #### Responses
  
  ```
  Status Code: 404 (Not Found)

  Body: {
    error: "Resource not found"
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: {
    metadata: {
      languages: string[],
      partsOfSpeech: string[],
      customers: string[],
      conceptIds: string[],
      approvalStatuses: string[],
      subjectFields: string[],
      personRefs: PersonRefObjectPreview[],
    }
  } & Termbase
  ```
</details>

---

<details>
  <summary>
    Get All Termbases
  </summary>

  #### URL
  /termbases?page=***:paginationPage***

  #### HTTP METHOD
  GET

  #### Allowed Roles
  Admin
  <br />
  Staff
  <br />
  User

  #### Responses
  
  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Invalid query params supplied."
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: {
    termbases: Termbase[],
    pagination: {
      page: number;
      pageCount: number;
      perPage: number;
      totalCount: number;
    }
  }
  ```
</details>

---

<details>
  <summary>
    Create Termbase
  </summary>

  #### URL
  /termbase

  #### HTTP METHOD
  POST

  #### Allowed Roles
  Admin
  <br />
  Staff

  #### Params
  @name
  <br />
  @lang
  <br />
  @description (optional)
  <br />

  #### Responses
  
  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Body Invalid"
  }
  ```

  ```
  Status Code: 409 (Conflict)

  Body: {
    error: "A base already exists with the same name."
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: {
    uuid: UUID
  }
  ```
</details>

---

<details>
  <summary>
    Update Termbase
  </summary>

  #### URL
  /termbase/***:termbaseUUID***

  #### HTTP METHOD
  PATCH

  #### Allowed Roles
  Admin
  <br />
  Staff


  #### Params
  @type (optional)
  <br />
  @name (optional)
  <br />
  @enforceBasicDialect (optional)
  <br />

  #### Responses

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Body Invalid"
  }
  ```

  ```
  Status Code: 404 (Not Found)

  Body: {
    error: "Resource not found"
  }
  ```

  ```
  Status Code: 409 (Conflict)

  Body: {
    error: "A base already exists with the same name."
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: Termbase
  ```

  #### Note
  **enforceBasicDialect** is initially true when a termbase is either uploaded or created. Once set to false, the parameter can not be changed. 
  <br />
  <br />
  **type** can only be updated once **enforceBasicDialect** is set to false.
</details>

---

<details>
  <summary>
    Delete Termbase
  </summary>

  #### URL
  /termbase/***:termbaseUUID***

  #### HTTP METHOD
  DELETE

  #### Allowed Roles
  Admin

  #### Responses

  ```
  Status Code: 204 (Success with no content)

  Body: {}
  ```
</details>

---

<br />

### Term

---

<details>
  <summary>
    Get Term
  </summary>

  #### URL
  /termbase/***:termbaseUUID***/term/***:termUUID***

  #### HTTP METHOD
  GET

  #### Allowed Roles
  Admin
  <br />
  Staff
  <br />
  User

  #### Responses
  
  ```
  Status Code: 404 (Not Found)

  Body: {
    error: "Resource not found"
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: TermFullView
  ```
</details>

---

<details>
  <summary>
    Get All Terms
  </summary>

  #### URL
  /termbase/***:termbaseUUID***/terms?page=***:paginationPage***

  #### HTTP METHOD
  GET

  #### Allowed Roles
  Admin
  <br />
  Staff
  <br />
  User

  #### Responses
  
  ```
  Status Code: 404 (Not Found)

  Body: {
    error: "Resource not found"
  }
  ```

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Invalid query params supplied."
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: {
    terms: TermPartialView[],
    pagination: {
      page: number;
      pageCount: number;
      perPage: number;
      totalCount: number;
    }
  }
  ```
</details>

---

<details>
  <summary>
    Create Term
  </summary>

  #### URL
  /termbase/***:termbaseUUID***/term

  #### HTTP METHOD
  POST

  #### Params
  @langSecUUID
  <br />
  @value
  <br />

  #### Allowed Roles
  Admin
  <br />
  Staff

  #### Responses
  
  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Body Invalid"
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: {
    uuid: UUID
  }
  ```
</details>

---

<details>
  <summary>
    Update Term
  </summary>

  #### URL
  /termbase/***:termbaseUUID***/term/***:termUUID***

  #### HTTP METHOD
  PATCH

  #### Params
  @id (optional)
  <br />
  @order (optional)
  <br/>
  @value (optional)
  <br />
  @termSecId (optional)

  #### Allowed Roles
  Admin
  <br />
  Staff

  #### Responses
  
  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Body Invalid"
  }
  ```

  ```
  Status Code: 404 (Not Found)

  Body: {
    error: "Resource not found"
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: TermPreview
  ```
</details>

---

<details>
  <summary>
    Delete Term
  </summary>

  #### URL
  /termbase/***:termbaseUUID***/term/***:termUUID***

  #### HTTP METHOD
  DELETE

  #### Allowed Roles
  Admin
  <br />
  Staff

  #### Responses
  
  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Language Sections must have at least one term."
  }
  ```

  ```
  Status Code: 204 (Success with no content)

  Body: {}
  ```
</details>

---

<br />

### Term Note

---

<details>
  <summary>
    Create Term Note
  </summary>

  ### URL
  /termbase/***:termbaseUUID***/termNote

  ### HTTP METHOD
  POST

  ### Params
  @isGrp
  <br />
  @type
  <br />
  @value
  <br />
  @termUUID

  ### Allowed Roles
  Admin
  <br />
  Staff

  ### Responses
  
  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Body Invalid"
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: {
    uuid: UUID
  }
  ```
</details>

---

<details>
  <summary>
    Update Term Note
  </summary>

  ### URL
  /termbase/***:termbaseUUID***/termNote/***:termNoteUUID***

  ### HTTP METHOD
  PATCH

  ### Params
  @id (optional)
  <br />
  @type (optional)
  <br /> 
  @value (optional)
  <br />
  @grpId (optional)
  <br />
  @target (optional)
  <br />
  @datatype (optional)
  <br />
  @langCode (optional)
  <br />
  @order (optional)

  ### Allowed Roles
  Admin
  <br />
  Staff

  ### Responses
  
  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Body Invalid"
  }
  ```

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Target does not reference a known ID"
  }
  ```

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "ID is invalid. ID must follow convention for XML."
  }
  ```

  ```
  Status Code: 404 (Not Found)

  Body: {
    error: "Resource not found"
  }
  ```
  
  ```
  Status Code: 409 (Conflict)

  Body: {
    error: "A TBX element already exists with the same ID."
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: TermNotePreview
  ```
</details>

---

<details>
  <summary>
    Delete Term Note
  </summary>

  ### URL
  /termbase/***:termbaseUUID***/termNote/***:termNoteUUID***

  ### HTTP METHOD
  DELETE

  ### Allowed Roles
  Admin
  <br />
  Staff

  ### Responses

  ```
  Status Code: 404 (Not Found)

  Body: {
    error: "Resource not found"
  }
  ```

  ```
  Status Code: 204 (Success with no content)

  Body: {}
  ```
</details>

---

<br />

### Ref Object

--- 

<details>
  <summary>
    Create Person Ref Object
  </summary>

  #### URL
  /termbase/***:termbaseUUID***/personRefObject

  #### HTTP METHOD
  POST

  #### Allowed Roles
  Admin
  <br />
  Staff
  <br />
  User

  #### Params
  @name
  <br />
  @email
  <br /> 
  @role
  <br />
  @id

  #### Note
  The resource will only be created if the **requester's user id is the same as the request's id**.

  #### Responses

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Body Invalid"
  }
  ```

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "The supplied user id does not match the requester's user id."
  }
  ```

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Person ID must be a UUID."
  }
  ```

  ```
  Status Code: 409 (Conflict)

  Body: {
    error: "A TBX element already exists with the same ID."
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: {
    uuid: UUID
  }
  ```
</details>

---

<br />

### Language Section

---

<details>
  <summary>
    Get Language Section
  </summary>

  #### URL
  /termbase/***:termbaseUUID***/langSec/***:langSecUUID***

  #### HTTP METHOD
  GET

  #### Allowed Roles
  Admin
  <br />
  Staff
  <br />
  User

  #### Responses

  ```
  Status Code: 404 (Not Found)

  Body: {
    error: "Resource not found."
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: LanguageSection
  ```
</details>

---

<details>
  <summary>
    Create Language Section
  </summary>

  #### URL
  /termbase/***:termbaseUUID***/langSec

  #### HTTP METHOD
  POST

  #### Allowed Roles
  Admin
  <br />
  Staff

  #### Params
  @entryUUID 
  <br />
  @langCode
  <br />
  @initialTerm

  #### Responses

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Body Invalid"
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: {
    uuid: UUID
  }
  ```
</details>

---

<details>
  <summary>
    Update Language Section
  </summary>

  #### URL
  /termbase/***:termbaseUUID***/langSec/***:langSecUUID***

  #### HTTP METHOD
  PATCH

  #### Allowed Roles
  Admin
  <br />
  Staff

  #### Params
  @langCode (optional)
  <br />
  @order (optional)

  #### Responses
  
  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Body Invalid"
  }
  ```

  ```
  Status Code: 404 (Not Found)

  Body: {
    error: "Resource not found"
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: LanguageSectionPreview
  ```
</details>

---

<details>
  <summary>
    Delete Language Section
  </summary>

  #### URL
  /termbase/***:termbaseUUID***/langSec/***:langSecUUID***

  #### HTTP METHOD
  DELETE

  #### Allowed Roles
  Admin
  <br />
  Staff

  #### Responses

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Concept entries must have at least one language section."
  }
  ```

  ```
  Status Code: 204 (Success with no content)

  Body: {}
  ```
</details>

---

<br />

### Concept Entry

---

<details>
  <summary>
    Get Concept Entry
  </summary>

  #### URL
  /termbase/***:termbaseUUID***/entry/***:entryUUID***

  #### HTTP METHOD
  GET

  #### Allowed Roles
  Admin
  <br />
  Staff
  <br />
  User

  #### Responses
  
  ```
  Status Code: 404 (Not Found)

  Body: {
    error: "Resource not found"
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: ConceptEntry
  ```
</details>

---

<details>
  <summary>
    Create Concept Entry
  </summary>

  #### URL
  /termbase/***:termbaseUUID***/entry

  #### HTTP METHOD
  POST

  #### Allowed Roles
  Admin
  <br />
  Staff

  #### Params
  @entryId 
  <br />
  @initialLanguageSection
  <br />
  @initialTerm

  #### Responses

  ```
  Status Code: 409 (Conflict)

  Body: {
    error: "A TBX element already exists with the same ID."
  }
  ```

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "ID is invalid. ID must follow convention for XML."
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: {
    uuid: UUID
  }
  ```
</details>

---

<details>
  <summary>
    Update Concept Entry
  </summary>

  #### URL
  /termbase/***:termbaseUUID***/entry/***:entryUUID***

  #### HTTP METHOD
  PATCH

  #### Allowed Roles
  Admin
  <br />
  Staff

  #### Params
  @id (optional)

  #### Responses

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Body Invalid"
  }
  ```

  ```
  Status Code: 409 (Conflict)

  Body: {
    error: "A TBX element already exists with the same ID."
  }
  ```

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "ID is invalid. ID must follow convention for XML."
  }
  ```

  ```
  Status Code: 404 (Not Found)

  Body: {
    error: "Resource not found"
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: ConceptEntryPreview
  ```
</details>

---

<details>
  <summary>
    Delete Concept Entry
  </summary>

  #### URL
  /termbase/***:termbaseUUID***/entry/***:entryUUID***

  #### HTTP METHOD
  DELETE

  #### Allowed Roles
  Admin
  <br />
  Staff

  #### Responses

  ```
  Status Code: 204 (Success with no content)

  Body: {}
  ```
</details>

---

<br />

### Aux Element

---

<details>
  <summary>
    Create Aux Element
  </summary>

  #### URL
  /termbase/***:termbaseUUID***/auxElement

  #### HTTP METHOD
  POST

  #### Allowed Roles
  Admin
  <br />
  Staff

  #### Params
  @parentElementType (TbxElement)
  <br />
  @parentUUID
  <br />
  @value
  <br />
  @elementType
  <br />
  @type (optional)
  <br />
  @target (optional)

  #### Responses

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Body Invalid"
  }
  ```

  ```
  Status Code: 404 (Not Found)

  Body: {
    error: "Resource not found"
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: {
    uuid: UUID
  }
  ```

  #### Note

  Although **type** is listed as an optional request parameter, the inclusion of this parameter depends on whether or not the auxiliary element being created requires a type attribute.
</details>

---

<details>
  <summary>
    Update Aux Element
  </summary>

  #### URL
  /termbase/***:termbaseUUID***/auxElement/***:auxElementUUID***

  #### HTTP METHOD
  PATCH

  #### Allowed Roles
  Admin
  <br />
  Staff

  #### Params
  @elementType (TbxElement)
  <br />
  @id (optional)
  <br />
  @grpId (optional)
  <br />
  @order (optional)
  <br />
  @target (optional)
  <br />
  @langCode (optional)
  <br />
  @datatype (optional)
  <br />
  @type (optional)
  <br />
  @value (optional)

  #### Responses

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Body Invalid"
  }
  ```

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Target does not reference a known ID"
  }
  ```

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "ID is invalid. ID must follow convention for XML."
  }
  ```

  ```
  Status Code: 404 (Not Found)

  Body: {
    error: "Resource not found"
  }
  ```

  ```
  Status Code: 409 (Conflict)

  Body: {
    error: "A TBX element already exists with the same ID."
  }
  ```

  ```
  Status Code: 200 (Success)

  Body: AuxElement
  ```
</details>

---

<details>
  <summary>
    Delete Aux Element
  </summary>

  #### URL
  /termbase/***:termbaseUUID***/auxElement/***:auxElementUUID***

  #### HTTP METHOD
  DELETE

  #### Allowed Roles
  Admin
  <br />
  Staff

  #### Params
  @elementType (TbxElement)

  #### Responses

  ```
  Status Code: 400 (Bad Request)

  Body: {
    error: "Body Invalid"
  }
  ```

  ```
  Status Code: 204 (Success with no content)

  Body: {}
  ```
</details>

---