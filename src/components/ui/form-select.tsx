import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { FormControl, FormLabel } from "./form"
import { Button } from "./button"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"


type Value = {
    label: string
    value: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function FormSelect({ label, field, values, form, formFieldName }: { label: string, field: any; values: Value[], form: any, formFieldName: string }) {
    return (
        <>
            <FormLabel>{label}</FormLabel>
            <Popover>
                <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                                "w-[200px] justify-between",
                                !field.value && "text-muted-foreground"
                            )}
                        >
                            {field.value
                                ? values.find(
                                    (value) => value.value === field.value
                                )?.label
                                : "Seleccionar"}
                            <ChevronsUpDown className="opacity-50" />
                        </Button>
                    </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                    <Command>
                        <CommandInput
                            placeholder="Pesquisar..."
                            className="h-9"
                        />
                        <CommandList>
                            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                            <CommandGroup>
                                {values.map((value) => (
                                    <CommandItem
                                        value={value.label}
                                        key={value.value}
                                        onSelect={() => {
                                            form.setValue(formFieldName, value.value)
                                        }}
                                    >
                                        {value.label}
                                        <Check
                                            className={cn(
                                                "ml-auto",
                                                value.value === field.value
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </>
    )
}