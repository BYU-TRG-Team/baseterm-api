import { v4 as uuid } from "uuid";
import { PostTermbaseEndpointResponse } from "@typings/responses";
import { generateJWT } from "@tests/helpers";
import { Role } from "@byu-trg/express-user-management";
import testApiClient from "@tests/test-api-client";

const jwt = generateJWT(
  Role.Staff
);

describe("tests PostTermbase controller", () => {
  test("should return a response indicating a new base has been created", async () => {
    const { status, body } = (
      await testApiClient
        .post("/termbase")
        .field({ 
          name: uuid(),
          lang: "en-US"
        })
        .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`])
    ) as { status: number, body: PostTermbaseEndpointResponse }; 

    expect(status).toBe(200);
    expect(body.uuid).toBeDefined();
  });

  test("should return a response indicating a termbase already exists with the same name", async () => {
    const baseName = uuid();
    await testApiClient
      .post("/termbase")
      .field({ 
        name: baseName,
        lang: "en-US"
      })
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);


    const { status, body } = await testApiClient
      .post("/termbase")
      .field({ 
        name: baseName,
        lang: "en-US"
      })
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(409);
    expect(body.error).toBe("A base already exists with the same name.");
  });

  test("should return a response indicating an invalid body (no name field)", async () => {
    const { status } = await testApiClient
      .post("/termbase")
      .field({ 
        lang: "en-US"
      })
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(400);
  });

  test("should return a response indicating an invalid body (no lang field)", async () => {
    const { status, body } = await testApiClient
      .post("/termbase")
      .field({ 
        name: uuid(),
      })
      .set("Cookie", [`TRG_AUTH_TOKEN=${jwt}`]);

    expect(status).toBe(400);
    expect(body.error).toBe("Body Invalid");
  });
});