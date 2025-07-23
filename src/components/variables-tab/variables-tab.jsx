import classNames from 'classnames';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';

import Input from '../forms/input.jsx';
import Box from '../box/box.jsx';
import styles from './variables-tab.css';

const messages = defineMessages({
    searchPlaceholder: {
        defaultMessage: 'Search',
        description: 'Placeholder text for search bar',
        id: 'tw.variablesTab.search'
    },
    sprite: {
        defaultMessage: 'Variables for this sprite',
        description: 'Heading for local sprite variables',
        id: 'tw.variablesTab.sprite'
    },
    global: {
        defaultMessage: 'Variables for all sprites',
        description: 'Heading for global variables',
        id: 'tw.variablesTab.global'
    },
    showLarge: {
        defaultMessage: 'Click to display very large value.',
        description: 'Button label for showing large variable value',
        id: 'tw.variablesTab.showLarge'
    }
});

class VariablesTab extends React.Component {
    constructor(props) {
        super(props);
        bindAll(this, [
            "handleSearch",
            "renderVariable"
        ]);
        this.state = {
            query: ''
        };
    }

    handleSearch (event) {
        this.setState({
            query: String(event.target.value).toLowerCase()
        });
    }

    renderVariable(variable) {
        const isTooBig = (variable.type === 'list' ? variable.value.join('\n').length > 5000000
            : String(variable.value).length > 1000000) && !this.props.showLargeValue[variable.id];

        const isEditing = variable.id === this.props.editingVariableId;
        const isEditingName = isEditing && this.props.editingVariableInput === 'name';
        const isEditingValue = isEditing && this.props.editingVariableInput === 'value';

        const displayVariableValue = isEditingValue ? this.props.editingVariableEditValue
            : (variable.type === 'list' ? variable.value.join('\n') : variable.value);

        const inputValueProps = {
            onFocus: () => this.props.onClickVariableValue(variable),
            onBlur: (event) => this.props.onEditVariableValue(event, variable),
            onChange: this.props.onTypeVariableValue,
            onKeyDown: (event) => this.props.onTypeVariableValue(event, variable),
        };

        return <tr key={variable.id}>
            <td className={styles.variableName}>
                <input
                    onFocus={() => this.props.onClickVariableName(variable)}
                    onBlur={(event) => this.props.onEditVariableName(event, variable)}
                    onChange={this.props.onTypeVariableName}
                    onKeyDown={(event) => this.props.onTypeVariableName(event, variable)}
                    value={isEditingName ? this.props.editingVariableEditName : variable.name}
                />
            </td>
            <td className={styles.variableValue}>
                {isTooBig ? (
                    <button
                        onClick={() => this.props.onClickShowLarge(variable.id)}
                        className={styles.valueTooBig}
                    >
                        <FormattedMessage {...messages.showLarge} />
                    </button>
                ) : variable.type === 'list' ? (
                    <textarea {...inputValueProps} value={displayVariableValue} />
                ) : (
                    <input {...inputValueProps} value={displayVariableValue} />
                )}
            </td>
        </tr>
    }

    render() {
        const { localVariables, globalVariables, intl } = this.props;

        const filteredLocal = localVariables.filter(varr =>
            varr.name.toLowerCase().includes(this.state.query)
        );
        const filteredGlobal = globalVariables.filter(varr =>
            varr.name.toLowerCase().includes(this.state.query)
        );

        return (
            <div className={styles.editorWrapper}>
                <Box className={styles.editorContainer}>
                    <Input
                        placeholder={intl.formatMessage(messages.searchPlaceholder)}
                        className={styles.searchBar}
                        onChange={this.handleSearch}
                    />

                    {filteredLocal.length > 0 && (
                        <div>
                            <span className={styles.heading}>
                                <FormattedMessage {...messages.sprite} />
                            </span>
                            <table>
                                <tbody>
                                    {filteredLocal.map(this.renderVariable)}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {filteredGlobal.length > 0 && (
                        <div>
                            <span className={styles.heading}>
                                <FormattedMessage {...messages.global} />
                            </span>
                            <table>
                                <tbody>
                                    {filteredGlobal.map(this.renderVariable)}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Box>
            </div>
        );
    }
}

VariablesTab.propTypes = {
    localVariables: PropTypes.array,
    globalVariables: PropTypes.array,
    showLargeValue: PropTypes.object,
    editingVariableId: PropTypes.string,
    editingVariableInput: PropTypes.string,
    editingVariableEditName: PropTypes.string,
    editingVariableEditValue: PropTypes.string,
    onClickShowLarge: PropTypes.func.isRequired,
    onClickVariableName: PropTypes.func.isRequired,
    onClickVariableValue: PropTypes.func.isRequired,
    onEditVariableName: PropTypes.func.isRequired,
    onEditVariableValue: PropTypes.func.isRequired,
    onTypeVariableName: PropTypes.func.isRequired,
    onTypeVariableValue: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired
};

export default injectIntl(VariablesTab);
