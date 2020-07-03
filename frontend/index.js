import {
    initializeBlock,
    useBase,
    useRecords,
    useGlobalConfig,
    useSettingsButton,
    useRecordById,
    useRecordActionData,
    Box,
    Dialog,
    Heading,
    Icon,
    TablePickerSynced,
    ViewPickerSynced,
    FieldPickerSynced,
    SwitchSynced,
    expandRecord,
    expandRecordList,
    expandRecordPickerAsync,
    RecordCard,
    FormField,
    Button,
    Select,
    Text,
    TextButton,
    Tooltip,
    ViewportConstraint
} from '@airtable/blocks/ui';
import {settingsButton, cursor} from '@airtable/blocks';
import { FieldType, ViewType } from '@airtable/blocks/models';
import React, {useState} from 'react';

function CheckOutBlock() {
    const base = useBase();
    const globalConfig = useGlobalConfig();
    
    const GlobalConfigKeys = {
        UNITS_TABLE_ID: "unitsTableId",
        UNITS_VIEW_ID: "unitsViewId",
        UNITS_CONDITION_FIELD_ID: "unitsConditionFieldId",
        UNITS_ORIGIN_DATE_FIELD_ID: "unitsOriginDateFieldId",
        UNITS_LINK_ITEMS_FIELD_ID: "unitsLinkItemsFieldId",
        UNITS_LINK_LOG_FIELD_ID: "unitsLinkLogFieldId",
        OPT_TRACK_ITEMS: "optTrackItems",
        OPT_TRACK_CONDITION: "optTrackCondition",
        OPT_TRACK_ORIGIN_DATE: "optTrackOriginDate",
        LOG_VIEW_ID: "logViewId",
        LOG_OUT_CONDITION_FIELD_ID: "logCheckOutConditionFieldId",
        LOG_OUT_DATE_FIELD_ID: "logCheckOutDateFieldId",
        LOG_IN_CONDITION_FIELD_ID: "logCheckInConditionFieldId",
        LOG_IN_DATE_FIELD_ID: "logCheckInDateFieldId"
    }
    
    const unitsTableId = globalConfig.get(GlobalConfigKeys.UNITS_TABLE_ID)
    const unitsViewId = globalConfig.get(GlobalConfigKeys.UNITS_VIEW_ID)
    const unitsConditionFieldId = globalConfig.get(GlobalConfigKeys.UNITS_CONDITION_FIELD_ID)
    const unitsOriginDateFieldId = globalConfig.get(GlobalConfigKeys.UNITS_ORIGIN_DATE_FIELD_ID)
    const unitsLinkItemsFieldId = globalConfig.get(GlobalConfigKeys.UNITS_LINK_ITEMS_FIELD_ID)
    const unitsLinkLogFieldId = globalConfig.get(GlobalConfigKeys.UNITS_LINK_LOG_FIELD_ID)
    const optTrackItems = globalConfig.get(GlobalConfigKeys.OPT_TRACK_ITEMS)
    const optTrackCondition = globalConfig.get(GlobalConfigKeys.OPT_TRACK_CONDITION)
    const optTrackOriginDate = globalConfig.get(GlobalConfigKeys.OPT_TRACK_ORIGIN_DATE)
    
    const unitsTable = base.getTableByIdIfExists(unitsTableId)
    const unitsLinkLogField = unitsTable ? unitsTable.getFieldByIdIfExists(unitsLinkLogFieldId) : null
    const logTableId = unitsLinkLogField ? unitsLinkLogField.options.linkedTableId : null
    const logViewId = globalConfig.get(GlobalConfigKeys.LOG_VIEW_ID)
    const logCheckOutConditionFieldId = globalConfig.get(GlobalConfigKeys.LOG_OUT_CONDITION_FIELD_ID)
    const logCheckOutDateFieldId = globalConfig.get(GlobalConfigKeys.LOG_OUT_DATE_FIELD_ID)
    const logCheckInConditionFieldId = globalConfig.get(GlobalConfigKeys.LOG_IN_CONDITION_FIELD_ID)
    const logCheckInDateFieldId = globalConfig.get(GlobalConfigKeys.LOG_IN_DATE_FIELD_ID)
    
    // Check if all settings options have values
    const initialSetupDone = (unitsTableId && unitsViewId && unitsLinkLogFieldId && logTableId && logViewId && logCheckOutDateFieldId && logCheckInDateFieldId) && (!optTrackCondition || unitsConditionFieldId && logCheckOutConditionFieldId && logCheckInConditionFieldId) && (!optTrackOriginDate || unitsOriginDateFieldId) && (!optTrackItems || unitsLinkItemsFieldId) ? true : false
    
    // Enable the settings button
    const [isShowingSettings, setIsShowingSettings] = useState(!initialSetupDone);
    useSettingsButton(function() {
        initialSetupDone && setIsShowingSettings(!isShowingSettings);
    });
    
    // Get tables, view ids, and field ids
    const availableUnits = useRecords(unitsTable ? unitsTable.getViewByIdIfExists(unitsViewId) : null)
    const unitsConditionsField = unitsTable ? unitsTable.getFieldByIdIfExists(unitsConditionFieldId) : null
    const unitsConditions = unitsConditionsField ? unitsConditionsField.options.choices.map(x => x.name) : null
    const unitsLinkItemsField = unitsTable ? unitsTable.getFieldByIdIfExists(unitsLinkItemsFieldId) : null
    
    const itemsTableId = unitsLinkItemsField ? unitsLinkItemsField.options.linkedTableId : null
    const itemsTable = base.getTableByIdIfExists(itemsTableId)
    const itemsLinkUnitsFieldId = unitsLinkItemsField ? unitsLinkItemsField.options.inverseLinkFieldId : null
    const itemsLinkUnitsField = itemsTable ? itemsTable.getFieldByIdIfExists(itemsLinkUnitsFieldId) : null
    
    const logTable = base.getTableByIdIfExists(logTableId)
    const checkedOutRecords = useRecords(logTable ? logTable.getViewByIdIfExists(logViewId) : null)
    const logLinkUnitsFieldId = unitsLinkLogField ? unitsLinkLogField.options.inverseLinkFieldId : null
    
    const logCheckOutConditionField = logTable && logCheckOutConditionFieldId ? logTable.getFieldByIdIfExists(logCheckOutConditionFieldId) : null
    const logCheckOutConditions = logCheckOutConditionField ? logCheckOutConditionField.options.choices.map(x => x.name) : null
    const logCheckInConditionField = logTable && logCheckInConditionFieldId ? logTable.getFieldByIdIfExists(logCheckInConditionFieldId) : null
    const logCheckInConditions = logCheckInConditionField ? logCheckInConditionField.options.choices.map(x => x.name) : null
    const logConditions = logCheckInConditions && logCheckOutConditions ? logCheckOutConditions.filter(x => logCheckInConditions.includes(x)) : null
    // Return the single select options found in all three conditions fields, prevents errors thrown if trying to copy an incompatable option from another field
    const sharedConditions = unitsConditions && logConditions ? unitsConditions.filter(x => logConditions.includes(x)) : null
    const bestCondition = sharedConditions ? sharedConditions[0] : null
    
    const today = new Date()
    const truncateText= {overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}
    
    // Collect info from record button type press
    const recordActionData = useRecordActionData();
    
    const tableId = recordActionData ? recordActionData.tableId : null
    const table = base.getTableByIdIfExists(tableId)
    const tableName = table ? table.name : null
    const recordId = recordActionData ? recordActionData.recordId : null
    const record = useRecordById(table, recordId)
    
    // The "mode" determines what action buttons are shown, and the variables used in the async functions
    const modes = [optTrackItems ? itemsTableId : null, unitsTableId, logTableId]
    const mode = modes.indexOf(tableId)
    
    // Items Actions (variables and functions for use in the action buttons)
    const unitsRecordsLinkedToItem = useRecords(record && mode == 0 ? record.selectLinkedRecordsFromCell(itemsLinkUnitsField) : null)
    // Returns records which are available (determined by presence in a view), and which have a Condition cell value that can be used in the other two condition fields
    const availableLinkedUnits = unitsRecordsLinkedToItem ? 
          unitsRecordsLinkedToItem.filter(x => availableUnits.map(y => y.id).includes(x.id) && (!optTrackCondition || sharedConditions && sharedConditions.includes(x.getCellValue(unitsConditionFieldId).name))) : null
    const anyAvailable = availableLinkedUnits != null && availableLinkedUnits.length ? true : false
    const bestAvailable = availableLinkedUnits
        ? availableLinkedUnits.sort((a, b) => (
            optTrackCondition && unitsConditionFieldId && sharedConditions.indexOf(a.getCellValue(unitsConditionFieldId).name) > sharedConditions.indexOf(b.getCellValue(unitsConditionFieldId).name)
        ) ? 1 : -1)[0] : null;
    
    // Units Actions (variables and functions for use in the action buttons)
    const logRecordsLinkedToUnit = useRecords(record && mode == 1 ? record.selectLinkedRecordsFromCell(unitsLinkLogField) : null)
    const checkedOutRecordsLinkedToUnit = logRecordsLinkedToUnit ? logRecordsLinkedToUnit.filter(x => checkedOutRecords.map(y => y.id).includes(x.id)) : null
    const recordIsAvailable = mode == 1 && availableUnits && availableUnits.map(y => y.id).includes(record.id) ? true : false
    const hasHistory = logRecordsLinkedToUnit != null && logRecordsLinkedToUnit.length ? true : false
    
    const checkCanCreateUnit = unitsTable ? unitsTable.checkPermissionsForCreateRecord() : null
    const checkCanUpdateUnit = unitsTable ? unitsTable.checkPermissionsForUpdateRecord() : null
    
    async function createNewUnit() {
        const fieldsAndValues = {
            [unitsLinkItemsFieldId]: [{id: record.id}],
            ...optTrackCondition && {[unitsConditionFieldId]: {name: bestCondition}},
            ...optTrackOriginDate && {[unitsOriginDateFieldId]: today}
        }
        
        const newRecordId = await unitsTable.createRecordAsync(fieldsAndValues)
        const query = await unitsTable.selectRecordsAsync()
        expandRecord(query.getRecordById(newRecordId))
        query.unloadData()
    }
    
    // Log Actions (variables and functions for use in the action buttons)
    const conditionsChoices = sharedConditions ? sharedConditions.map(x => {return ({value: x, label: x})}) : []
    const recordIsCheckedIn = mode == 2 && checkedOutRecords.map(y => y.id).includes(record.id) ? false : true
    const unitsRecordsLinkedToLog = useRecords(record && mode == 2 ? record.selectLinkedRecordsFromCell(logLinkUnitsFieldId) : null)
    
    
    const checkCanCreateLog = logTable ? logTable.checkPermissionsForCreateRecord() : null
    
    async function viewHistory() {
        const recordA = await expandRecordList(logRecordsLinkedToUnit)
    }
    
    async function checkOutUnitAuto() {
        const logCheckOutInput = mode == 0 ? bestAvailable : record
        const fieldsAndValues = {
            [logLinkUnitsFieldId]: [{id: logCheckOutInput.id}],
            [logCheckOutDateFieldId]: today,
            ...optTrackCondition && {[logCheckOutConditionFieldId]: {name: logCheckOutInput.getCellValue(unitsConditionFieldId).name}},
        }
        
        const newRecordId = await logTable.createRecordAsync(fieldsAndValues)
        const query = await logTable.selectRecordsAsync()
        expandRecord(query.getRecordById(newRecordId))
        query.unloadData()
    }

    async function checkOutUnitSelect() {
        const logCheckOutInput = await expandRecordPickerAsync(availableLinkedUnits)
        
        if (logCheckOutInput) {
            const fieldsAndValues = {
                [logLinkUnitsFieldId]: [{id: logCheckOutInput.id}],
                [logCheckOutDateFieldId]: today,
                ...optTrackCondition && {[logCheckOutConditionFieldId]: {name: logCheckOutInput.getCellValue(unitsConditionFieldId).name}}
            }
            const newRecordId = await logTable.createRecordAsync(fieldsAndValues)
            const query = await logTable.selectRecordsAsync()
            expandRecord(query.getRecordById(newRecordId))
            query.unloadData()
        }
    }
    
    const checkCanUpdateLog = logTable ? logTable.checkPermissionsForUpdateRecord() : null
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newCondition, setNewCondition] = useState(null);
    
    async function checkInUnit() {
        const logCheckInInput = mode == 2 ? record : checkedOutRecordsLinkedToUnit[0]
        const fieldsAndValues = {
            [logCheckInDateFieldId]: today,
            ...optTrackCondition && {[logCheckInConditionFieldId]: {name: newCondition}}
        }
        
        await logTable.updateRecordAsync(logCheckInInput, fieldsAndValues)
        
        const unitInput = mode == 2 ? unitsRecordsLinkedToLog[0] : record
        
        if(optTrackCondition && unitInput) {
            
            await unitsTable.updateRecordAsync(unitInput, {
                [unitsConditionFieldId]: {name: newCondition}
            })
            setNewCondition(null)
        }
        setIsDialogOpen(false)
    }
    
    const emptyViewportText = !initialSetupDone ? "Please complete all settings" : "Click an action button associated with this block"
    
    return (
        <React.Fragment>
            <BlockContainer>
                <Box padding={4} flex="1 1" overflow="hidden">
                    {(!initialSetupDone || !recordActionData || recordActionData && !modes.includes(tableId)) && (
                        <Box padding={6} backgroundColor="lightGray1" border="thick" borderRadius="large">
                            <Heading margin={0} variant="caps" textAlign="center">{emptyViewportText}</Heading>
                        </Box>
                    )}
                    {initialSetupDone && recordActionData && modes.includes(tableId) &&  (
                        <React.Fragment>
                            <Box display="flex" flex="1 1" flexWrap="wrap" width="100%" justifyContent="space-between" paddingBottom={3} borderBottom="thick">
                                <Box marginX={4} style={truncateText}>
                                    <Heading variant="caps" size="xsmall" textColor="light">Table</Heading>
                                    <Heading size="small" style={truncateText}>{recordActionData && (table.name)}</Heading>
                                </Box>
                                <Box marginX={4} flex="1 1" style={truncateText}>
                                    <Heading variant="caps" size="xsmall" textColor="light">Record</Heading>
                                    <Heading size="small" style={truncateText}>{recordActionData && (record.name)}</Heading>
                                </Box>
                            </Box>
                            <RecordCard record={record} marginY={4} marginX="auto" />
                            <Box display="flex" flexWrap="wrap" justifyContent="center">
                                {mode == 0 && (
                                    <React.Fragment>
                                        <ActionButton
                                            disabledCondition={!checkCanCreateUnit.hasPermission}
                                            tooltipContent={checkCanCreateUnit.reasonDisplayString}
                                            buttonIcon="duplicate"
                                            buttonAction={createNewUnit}
                                            buttonText="Add new unit"
                                        />
                                        <ActionButton
                                            disabledCondition={!checkCanCreateLog.hasPermission || !anyAvailable}
                                            tooltipContent={!checkCanCreateLog.hasPermission ? checkCanCreateLog.reasonDisplayString : "No available units"}
                                            buttonIcon="checkboxUnchecked"
                                            buttonAction={checkOutUnitAuto}
                                            buttonText="Check out (auto)"
                                        />
                                        <ActionButton
                                            disabledCondition={!checkCanCreateLog.hasPermission || !anyAvailable}
                                            tooltipContent={!checkCanCreateLog.hasPermission ? checkCanCreateLog.reasonDisplayString : "No available units"}
                                            buttonIcon="checkboxUnchecked"
                                            buttonAction={checkOutUnitSelect}
                                            buttonText="Check out (select)"
                                        />
                                    </React.Fragment>
                                )}
                                {mode == 1 && (
                                    <React.Fragment>
                                        <ActionButton
                                            disabledCondition={!hasHistory}
                                            tooltipContent="No log records"
                                            buttonIcon="expand1"
                                            buttonAction={viewHistory}
                                            buttonText="View history"
                                        />
                                        <ActionButton
                                            disabledCondition={!checkCanCreateLog.hasPermission || !recordIsAvailable}
                                            tooltipContent={!checkCanCreateLog.hasPermission ? checkCanCreateLog.reasonDisplayString : "Unit is unavailable"}
                                            buttonIcon="checkboxUnchecked"
                                            buttonAction={checkOutUnitAuto}
                                            buttonText="Check out"
                                        />
                                        <ActionButton
                                            disabledCondition={!checkCanUpdateLog.hasPermission || recordIsAvailable}
                                            tooltipContent={!checkCanUpdateLog.hasPermission ? checkCanUpdateLog.reasonDisplayString : "Unit isn't checked out"}
                                            buttonIcon="checkboxChecked"
                                            buttonAction={optTrackCondition ? () => setIsDialogOpen(true) : checkInUnit}
                                            buttonText="Check in"
                                        />
                                    </React.Fragment>
                                )}
                                {mode == 2 && (
                                    <React.Fragment>
                                        <ActionButton
                                            disabledCondition={!checkCanUpdateLog.hasPermission || recordIsCheckedIn}
                                            tooltipContent={!checkCanUpdateLog.hasPermission ? checkCanUpdateLog.reasonDisplayString : "Record is already checked in"}
                                            buttonIcon="checkboxChecked"
                                            buttonAction={optTrackCondition ? () => setIsDialogOpen(true) : checkInUnit}
                                            buttonText="Check in"
                                        />
                                    </React.Fragment>
                                )}
                                {isDialogOpen && (
                                    <Dialog onClose={() => setIsDialogOpen(false)} width="320px">
                                        <Dialog.CloseButton />
                                        {optTrackCondition && (
                                            <React.Fragment>
                                                <FormField label="What condition is the unit in?" marginBottom={2}>
                                                    <Select options={conditionsChoices} value={newCondition} onChange={newValue => setNewCondition(newValue)} />
                                                </FormField>
                                            </React.Fragment>
                                         )}
                                        <Button variant="primary" icon="check" disabled={optTrackCondition && !newCondition} onClick={checkInUnit}>Done</Button>
                                    </Dialog>
                                )}
                            </Box>
                        </React.Fragment>
                    )}
                </Box>
                {isShowingSettings && (
                    <SettingsMenu
                        globalConfig={globalConfig}
                        GlobalConfigKeys={GlobalConfigKeys}
                        base={base}
                        initialSetupDone={initialSetupDone}
                        onDoneClick={() => setIsShowingSettings(false)}
                    />
                )}
            </BlockContainer>
        </React.Fragment>
    )
}

function ActionButton(props) {
    return (
        <Tooltip
            disabled={!props.disabledCondition}
            content={props.tooltipContent}
            placementX={Tooltip.placements.CENTER}
            placementY={Tooltip.placements.BOTTOM}
            shouldHideTooltipOnClick={true}
          >
            <Box marginX={3} marginY={2}>
                <Button variant="primary" icon={props.buttonIcon} onClick={props.buttonAction} disabled={props.disabledCondition}>{props.buttonText}</Button>
            </Box>
        </Tooltip>
    )
}

function SettingsMenu(props) {
    const base = props.base
    
    const unitsTableId = props.GlobalConfigKeys.UNITS_TABLE_ID
    const unitsTable = base.getTableByIdIfExists(props.globalConfig.get(unitsTableId))
    const unitsViewId = props.GlobalConfigKeys.UNITS_VIEW_ID
    const unitsConditionFieldId = props.GlobalConfigKeys.UNITS_CONDITION_FIELD_ID
    const unitsOriginDateFieldId = props.GlobalConfigKeys.UNITS_ORIGIN_DATE_FIELD_ID
    const unitsLinkItemsFieldId = props.GlobalConfigKeys.UNITS_LINK_ITEMS_FIELD_ID
    const unitsLinkLogFieldId = props.GlobalConfigKeys.UNITS_LINK_LOG_FIELD_ID
    const unitsLinkLogField = unitsTable ? unitsTable.getFieldByIdIfExists(props.globalConfig.get(unitsLinkLogFieldId)) : null
    
    const logTableId = unitsLinkLogField ? unitsLinkLogField.options.linkedTableId : null
    const logTable = base.getTableByIdIfExists(logTableId)
    const logViewId = props.GlobalConfigKeys.LOG_VIEW_ID
    const logCheckOutConditionFieldId = props.GlobalConfigKeys.LOG_OUT_CONDITION_FIELD_ID
    const logCheckOutDateFieldId = props.GlobalConfigKeys.LOG_OUT_DATE_FIELD_ID
    const logCheckInConditionFieldId = props.GlobalConfigKeys.LOG_IN_CONDITION_FIELD_ID
    const logCheckInDateFieldId = props.GlobalConfigKeys.LOG_IN_DATE_FIELD_ID
    
    const optTrackItemsKey = props.GlobalConfigKeys.OPT_TRACK_ITEMS
    const optTrackItems = props.globalConfig.get(optTrackItemsKey)
    
    const optTrackConditionKey = props.GlobalConfigKeys.OPT_TRACK_CONDITION
    const optTrackCondition = props.globalConfig.get(optTrackConditionKey)
    
    const optTrackOriginDateKey = props.GlobalConfigKeys.OPT_TRACK_ORIGIN_DATE
    const optTrackOriginDate = props.globalConfig.get(optTrackOriginDateKey)
    
    const resetUnitsFields = () => {
        const paths = [
            {path: [unitsViewId], value: null},
            {path: [unitsConditionFieldId], value: null},
            {path: [unitsOriginDateFieldId], value: null},
            {path: [unitsLinkItemsFieldId], value: null},
            {path: [unitsLinkLogFieldId], value: null},
            {path: [optTrackItemsKey], value: null},
            {path: [optTrackConditionKey], value: null},
            {path: [optTrackOriginDateKey], value: null},
            {path: [logViewId], value: null},
            {path: [logCheckOutConditionFieldId], value: null},
            {path: [logCheckOutDateFieldId], value: null},
            {path: [logCheckInConditionFieldId], value: null},
            {path: [logCheckInDateFieldId], value: null}
        ]
        props.globalConfig.setPathsAsync(paths);
    }
    const resetLogFields = () => {
        const paths = [
            {path: [logViewId], value: null},
            {path: [logCheckOutConditionFieldId], value: null},
            {path: [logCheckOutDateFieldId], value: null},
            {path: [logCheckInConditionFieldId], value: null},
            {path: [logCheckInDateFieldId], value: null},
        ]
        props.globalConfig.setPathsAsync(paths);
    }
    
    return(
        <React.Fragment>
            <Box flex="none" display="flex" flexDirection="column" width="300px" height="100vh" backgroundColor="lightGray1">
                <Box flex="auto" display="flex" flexDirection="column" minHeight="0" padding={3} overflowY="auto">
                    <Heading> Settings</Heading>
                    <Box borderTop="thick" paddingTop={3}>
                        <FormField label="Units table">
                            <TablePickerSynced 
                                globalConfigKey={unitsTableId}
                                onChange={resetUnitsFields}
                            />
                        </FormField>
                        <FormField label="Available units view (Units table)">
                            <ViewPickerSynced 
                                globalConfigKey={unitsViewId}
                                table={unitsTable}
                            />
                        </FormField>
                        <FormField label="Log table linked record field (Units table)">
                            <FieldPickerSynced
                                globalConfigKey={unitsLinkLogFieldId}
                                table={unitsTable}
                                allowedTypes={[
                                    FieldType.MULTIPLE_RECORD_LINKS
                                ]}
                                onChange={resetLogFields}
                            />
                        </FormField>
                    </Box>
                    <Box borderTop="thick" paddingTop={3}>
                        <SwitchSynced globalConfigKey={optTrackItemsKey} label="Linked to a table of unit types?" marginBottom={2} />
                        {optTrackItems && (
                            <React.Fragment>
                                <FormField label="Items table linked record field">
                                    <FieldPickerSynced
                                        globalConfigKey={unitsLinkItemsFieldId}
                                        table={unitsTable}
                                        allowedTypes={[
                                            FieldType.MULTIPLE_RECORD_LINKS
                                        ]}
                                    />
                                </FormField>
                                <SwitchSynced globalConfigKey={optTrackOriginDateKey} label="Pre-fill unit origin date?" marginBottom={2} />
                                {optTrackOriginDate && (
                                    <FormField label="Unit origin date (Units table)">
                                        <FieldPickerSynced
                                            globalConfigKey={unitsOriginDateFieldId}
                                            table={unitsTable}
                                            allowedTypes={[
                                                FieldType.DATE,
                                                FieldType.DATE_TIME
                                            ]}
                                        />
                                    </FormField>
                                )}
                            </React.Fragment>
                        )}
                    </Box>
                    <Box borderTop="thick" paddingTop={3}>
                        <SwitchSynced globalConfigKey={optTrackConditionKey} label="Track unit condition?" marginBottom={2} />
                        {optTrackCondition && (
                            <React.Fragment>
                                <FormField label="Current condition field (Units table)">
                                    <FieldPickerSynced
                                        globalConfigKey={unitsConditionFieldId}
                                        table={unitsTable}
                                        allowedTypes={[
                                            FieldType.SINGLE_SELECT
                                        ]}
                                    />
                                </FormField>
                                <FormField label="Condition upon check out field (Log table)">
                                    <FieldPickerSynced
                                        globalConfigKey={logCheckOutConditionFieldId}
                                        table={logTable}
                                        allowedTypes={[
                                            FieldType.SINGLE_SELECT
                                        ]}
                                    />
                                </FormField>
                                <FormField label="Condition upon check in field (Log table)">
                                    <FieldPickerSynced
                                        globalConfigKey={logCheckInConditionFieldId}
                                        table={logTable}
                                        allowedTypes={[
                                            FieldType.SINGLE_SELECT
                                        ]}
                                    />
                                </FormField>
                            </React.Fragment>
                        )}
                    </Box>
                    <Box borderTop="thick" paddingTop={3}>
                        <FormField label="Checked out view (Log table)">
                            <ViewPickerSynced 
                                globalConfigKey={logViewId}
                                table={logTable}
                            />
                        </FormField>
                        <FormField label="Check out date field (Log table)">
                            <FieldPickerSynced
                                globalConfigKey={logCheckOutDateFieldId}
                                table={logTable}
                                allowedTypes={[
                                    FieldType.DATE,
                                    FieldType.DATE_TIME
                                ]}
                            />
                        </FormField>
                        <FormField label="Check in date field (Log table)">
                            <FieldPickerSynced
                                globalConfigKey={logCheckInDateFieldId}
                                table={logTable}
                                allowedTypes={[
                                    FieldType.DATE,
                                    FieldType.DATE_TIME
                                ]}
                            />
                        </FormField>
                    </Box>
                </Box>
                <Box flex="none" display="flex" justifyContent="space-between" paddingY={3} marginX={3} borderTop="thick">
                    <Button
                        variant="primary"
                        size="large"
                        icon="check"
                        disabled={!props.initialSetupDone}
                        onClick={props.onDoneClick}
                    >
                        Done
                    </Button>
                </Box>
            </Box>
        </React.Fragment>
    )
}

function BlockContainer({children}) {
    return (
        <div id="Units-Assistant-Block" position="absolute" top={0} left={0} right={0} bottom={0} overflow="hidden">
            <ViewportConstraint minSize={{width: 632, height: 200}}>
                <Box display="flex" justifyItems="center" width="100%" height="100%" overflow="hidden">
                    {children}
                </Box>
            </ViewportConstraint>
        </div>
    )
}

initializeBlock(() => <CheckOutBlock />);
