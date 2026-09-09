import { pageMetadata } from "@/lib/seo";
import { methods } from "@/content/methods";
import { MethodPage } from "@/components/methods/MethodPage";

const method = methods["clean-exit"];

export const metadata = pageMetadata({
  title: method.metaTitle,
  description: method.metaDescription,
  path: method.path,
  ogType: "article",
});

export default function Page() {
  return <MethodPage method={method} />;
}
