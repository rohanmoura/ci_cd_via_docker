import { describe, expect, test } from "bun:test";

import { serviceNames } from "./index";

describe("serviceNames", () => {
  test("lists the three application workspaces", () => {
    expect(serviceNames).toEqual(["web", "http-server", "ws-server"]);
  });
});
