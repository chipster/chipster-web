import Dataset from "../../model/session/dataset";
import Category from "../../model/session/category";
import Module from "../../model/session/module";
import Tool from "../../model/session/tool";

export interface IChipsterFilter extends ng.IFilterService {
    (name: 'bytesFilter'): (bytes: string|number, precision: number) => string;
    (name: 'categoryFilter'): (arr: Category[], searchTool: string) => Category[];
    (name: 'moduleFilter'): (arr: Module[], searchTool: string) => Module[];
    (name: 'searchDatasetFilter'): (array: Dataset[], expression: string) => Dataset[];
    (name: 'secondsFilter'): (seconds: number|string) => string;
    (name: 'toolFilter'): (arr: Tool[], searchTool: string) => Tool[];
}