import AiToolRunner from "@/components/AiToolRunner";

export default function RecipeGeneratorPage() {
  return (
    <AiToolRunner
      toolId="recipe-generator"
      title="Recipe Generator"
      description="Tell it what ingredients you have or what you're craving."
      placeholder="e.g. chicken thighs, rice, and whatever's in my fridge — something quick for tonight"
    />
  );
}