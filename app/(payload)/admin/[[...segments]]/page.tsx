/* eslint-disable @next/next/no-before-interactive-script-outside-document */
import type { Metadata } from "next";
import { RootPage } from "@payloadcms/next/views";
import config from "@payload-config";
import { importMap } from "../importMap";

export const metadata: Metadata = {
  title: "NovaTech Admin",
  robots: "noindex,nofollow",
};

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
};

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, importMap, params, searchParams });

export default Page;
