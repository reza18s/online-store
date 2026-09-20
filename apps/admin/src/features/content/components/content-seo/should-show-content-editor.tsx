export function shouldShowContentEditor(input: {
  itemCount: number;
  selectedId: string;
  isCreating: boolean;
}): boolean {
  return input.itemCount > 0 || Boolean(input.selectedId) || input.isCreating;
}
