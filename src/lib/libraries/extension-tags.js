import messages from './tag-messages.js';

let tags = [
    { tag: 'penguinmod', intlLabel: messages.penguinmod },
    { tag: 'turbowarp', intlLabel: messages.turbowarp },
    { tag: 'scratch', intlLabel: messages.scratch },
    { tag: 'divider2', intlLabel: messages.scratch, type: 'divider' },
    { tag: 'graphics', intlLabel: messages.graphics },
    { tag: 'noisemaker', intlLabel: messages.noisemaker },
    { tag: 'math', intlLabel: messages.math },
    { tag: 'datamgmt', intlLabel: messages.datamgmt },
    { tag: 'hardware', intlLabel: messages.hardware },
    { tag: 'divider2', intlLabel: messages.scratch, type: 'divider' },
    { tag: 'categoryexpansion', intlLabel: messages.categoryexpansion },
    { tag: 'programminglanguage', intlLabel: messages.programminglanguage },
    { tag: 'divider1', intlLabel: messages.scratch, type: 'divider' },
    { tag: 'library', intlLabel: messages.library },
    { tag: 'extcreate', intlLabel: messages.extcreate },
    { tag: 'divider3', intlLabel: messages.scratch, type: 'divider' },
    { tag: 'divider1', intlLabel: 'Actions', type: 'title' },
    { tag: 'custom', intlLabel: messages.customextension, type: 'custom', func: (library) => {
        library.select('');
    } },
];

// 条件によって tags をフィルター
if (typeof ENV !== 'undefined' && ENV.CanLoadCustomExtension === false) {
    tags = tags.filter(item => {
        if (item.tag === 'divider1' && item.intlLabel === 'Actions') return false;
        if (item.tag === 'custom') return false;
        return true;
    });
}

export default tags;
