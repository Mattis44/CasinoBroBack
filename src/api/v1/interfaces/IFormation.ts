import { IFormationStep } from "./IFormationStep";
import { IForum } from "./IForum";

export interface IFormation extends IForum {
    steps: IFormationStep[];
    date_formation: Date;
    bl_formation: boolean;
}