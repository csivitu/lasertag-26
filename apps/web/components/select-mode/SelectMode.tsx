import { SelectModeDesktop } from "./SelectModeDesktop";
import { SelectModeMobile } from "./SelectModeMobile";

export function SelectMode() {
  return (
    <>
      <SelectModeMobile />
      <SelectModeDesktop />
    </>
  );
}
