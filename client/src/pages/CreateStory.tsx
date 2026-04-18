import { Redirect } from "wouter";

/** Story creation now lives on the home page — choose a type and tap "Tell me this story". */
export default function CreateStory() {
  return <Redirect to="/" />;
}
