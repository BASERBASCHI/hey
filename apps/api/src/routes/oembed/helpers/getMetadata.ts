import { parseHTML } from "linkedom";
import { HEY_USER_AGENT } from "@/utils/constants";
import getDescription from "./meta/getDescription";
import getTitle from "./meta/getTitle";

const fetchData = async (url: string) => {
  const response = await fetch(url, {
    headers: { "User-Agent": HEY_USER_AGENT }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return await response.text();
};

const extractMetadata = (document: Document, url: string) => {
  return {
    description: getDescription(document),
    title: getTitle(document),
    url
  };
};

const getMetadata = async (url: string) => {
  try {
    const data = await fetchData(url);
    const { document } = parseHTML(data);
    return extractMetadata(document, url);
  } catch {
    return { description: null, title: null, url };
  }
};

export default getMetadata;
