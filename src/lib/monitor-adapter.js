import OpcodeLabels from './opcode-labels.js';

const isUndefined = a => typeof a === 'undefined';

const circularReplacer = () => {
    const stack = new Set();
    return function replacer(_, value) {
        if (typeof value === "object" && value !== null) {
            if (stack.has(value)) return Array.isArray(value) ? "[...]" : "{...}";
            stack.add(value);
        }
        return value;
    };
};

/**
 * Convert monitors from VM format to what the GUI needs to render.
 * - Convert opcode to a label and a category
 * @param {string} block.id - The id of the monitor block
 * @param {string} block.spriteName - Present only if the monitor applies only to the sprite
 *     with given target ID. The name of the target sprite when the monitor was created
 * @param {string} block.opcode - The opcode of the monitor
 * @param {object} block.params - Extra params to the monitor block
 * @param {string|number|Array} block.value - The monitor value
 * @param {VirtualMachine} block.vm - the VM instance which owns the block
 * @return {object} The adapted monitor with label and category
 */
export default function ({id, spriteName, opcode, params, value, vm}) {
    // Extension monitors get their labels from the Runtime through `getLabelForOpcode`.
    // Other monitors' labels are hard-coded in `OpcodeLabels`.
    let {label, category, labelFn} = (vm && vm.runtime.getLabelForOpcode(opcode)) || OpcodeLabels.getLabel(opcode);

    // Use labelFn if provided for dynamic labelling (e.g. variables)
    if (!isUndefined(labelFn)) label = labelFn(params);

    // Append sprite name for sprite-specific monitors
    if (spriteName) {
        label = `${spriteName}: ${label}`;
    }

    // If value is a number, round it to six decimal places
    if (typeof value === 'number') {
        value = Number(value.toFixed(6));
    }

    // Turn the value to a string, for handle boolean values
    if (typeof value === 'boolean') {
        value = value.toString();
    }
    
    // Lists can contain booleans, which should also be turned to strings
    if (Array.isArray(value)) {
        value = value.slice();
        for (let i = 0; i < value.length; i++) {
            const item = value[i];
            if (typeof item === 'boolean') {
                value[i] = item.toString();
            }
            if (typeof item === 'object') {
                // check if this is a pure object or custom display
                if (typeof (item.toListItem || value.toMonitorContent || item.toReporterContent) === 'function') {
                    value[i].isHTML = true;
                } else {
                    value[i] = JSON.stringify(item, circularReplacer());
                }
            }
        }
    }

    let isHTML = false;
    if (typeof value === 'object') {
        // check if this is a pure object or custom display
        if (typeof (value.toMonitorContent || value.toReporterContent) === 'function') {
            value = value.toMonitorContent
              ? value.toMonitorContent() : value.toReporterContent();
            isHTML = true;
        } else if (!Array.isArray(value)) {
            // only applies to objects
            value = JSON.stringify(value, circularReplacer());
        }
    }

    return {id, label, category, value, isHTML};
}