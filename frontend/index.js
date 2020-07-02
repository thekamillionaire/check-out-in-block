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

function InventoryAssistantBlock() {
    const base = useBase();
    const globalConfig = useGlobalConfig();
    
    const GlobalConfigKeys = {
        UNITS_TABLE_ID: "unitsTableId",
        UNITS_VIEW_ID: "unitsViewId",
        UNITS_CONDITION_FIELD_ID: "unitsConditionFieldId",
        UNITS_PURCHASE_DATE_FIELD_ID: "unitsPurchaseDateFieldId",
        UNITS_LINK_ITEMS_FIELD_ID: "unitsLinkItemsFieldId",
        UNITS_LINK_LOG_FIELD_ID: "unitsLinkLogFieldId",
        UNITS_TRACK_ITEMS: "unitsTrackItems",
        UNITS_TRACK_CONDITION: "unitsTrackCondition",
        UNITS_TRACK_ORIGIN_DATE: "unitsTrackOriginDate",
        LOG_TABLE_ID: "logTableId",
        LOG_VIEW_ID: "logViewId",
        LOG_OUT_CONDITION_FIELD_ID: "logCheckOutConditionFieldId",
        LOG_OUT_DATE_FIELD_ID: "logCheckOutDateFieldId",
        LOG_IN_CONDITION_FIELD_ID: "logCheckInConditionFieldId",
        LOG_IN_DATE_FIELD_ID: "logCheckInDateFieldId"
    }
    
    const unitsTableId = globalConfig.get(GlobalConfigKeys.UNITS_TABLE_ID)
    const unitsViewId = globalConfig.get(GlobalConfigKeys.UNITS_VIEW_ID)
    const unitsConditionFieldId = globalConfig.get(GlobalConfigKeys.UNITS_CONDITION_FIELD_ID)
    const unitsPurchaseDateFieldId = globalConfig.get(GlobalConfigKeys.UNITS_PURCHASE_DATE_FIELD_ID)
    const unitsLinkItemsFieldId = globalConfig.get(GlobalConfigKeys.UNITS_LINK_ITEMS_FIELD_ID)
    const unitsLinkLogFieldId = globalConfig.get(GlobalConfigKeys.UNITS_LINK_LOG_FIELD_ID)
    const unitsTrackItems = globalConfig.get(GlobalConfigKeys.UNITS_TRACK_ITEMS)
    const unitsTrackCondition = globalConfig.get(GlobalConfigKeys.UNITS_TRACK_CONDITION)
    const unitsTrackOriginDate = globalConfig.get(GlobalConfigKeys.UNITS_TRACK_ORIGIN_DATE)
    
    const logTableId = globalConfig.get(GlobalConfigKeys.LOG_TABLE_ID)
    const logViewId = globalConfig.get(GlobalConfigKeys.LOG_VIEW_ID)
    const logCheckOutConditionFieldId = globalConfig.get(GlobalConfigKeys.LOG_OUT_CONDITION_FIELD_ID)
    const logCheckOutDateFieldId = globalConfig.get(GlobalConfigKeys.LOG_OUT_DATE_FIELD_ID)
    const logCheckInConditionFieldId = globalConfig.get(GlobalConfigKeys.LOG_IN_CONDITION_FIELD_ID)
    const logCheckInDateFieldId = globalConfig.get(GlobalConfigKeys.LOG_IN_DATE_FIELD_ID)
    
    // Check if all settings options have values
    const initialSetupDone = unitsTableId && unitsViewId && unitsConditionFieldId && unitsPurchaseDateFieldId && unitsLinkItemsFieldId && unitsLinkLogFieldId && logTableId && logViewId && logCheckOutConditionFieldId && logCheckOutDateFieldId && logCheckInConditionFieldId && logCheckInDateFieldId ? true : false
    
    // Enable the settings button
    const [isShowingSettings, setIsShowingSettings] = useState(!initialSetupDone);
    useSettingsButton(function() {
        initialSetupDone && setIsShowingSettings(!isShowingSettings);
    });
    
    // Get tables, view ids, and field ids
    const unitsTable = base.getTableByIdIfExists(unitsTableId)
    const availableUnits = useRecords(unitsTable ? unitsTable.getViewByIdIfExists(unitsViewId) : null)
    const unitsConditionsField = unitsTable ? unitsTable.getFieldByIdIfExists(unitsConditionFieldId) : null
    const unitsConditions = unitsConditionsField ? unitsConditionsField.options.choices.map(x => x.name) : null
    const unitsLinkItemsField = unitsTable ? unitsTable.getFieldByIdIfExists(unitsLinkItemsFieldId) : null
    const unitsLinkLogField = unitsTable ? unitsTable.getFieldByIdIfExists(unitsLinkLogFieldId) : null
    
    const itemsTableId = unitsLinkItemsField ? unitsLinkItemsField.options.linkedTableId : null
    const itemsTable = base.getTableByIdIfExists(itemsTableId)
    const itemsLinkUnitsFieldId = unitsLinkItemsField ? unitsLinkItemsField.options.inverseLinkFieldId : null
    const itemsLinkUnitsField = itemsTable ? itemsTable.getFieldByIdIfExists(itemsLinkUnitsFieldId) : null
    
    const logTable = base.getTableByIdIfExists(logTableId)
    const checkedOutRecords = useRecords(logTable ? logTable.getViewByIdIfExists(logViewId) : null)
    const logLinkUnitsFieldId = unitsLinkLogField ? unitsLinkLogField.options.inverseLinkFieldId : null
    
    const logCheckOutConditionField = logTable ? logTable.getFieldByIdIfExists(logCheckOutConditionFieldId) : null
    const logCheckOutConditions = logCheckOutConditionField ? logCheckOutConditionField.options.choices.map(x => x.name) : null
    const logCheckInConditionField = logTable ? logTable.getFieldByIdIfExists(logCheckInConditionFieldId) : null
    const logCheckInConditions = logCheckInConditionField ? logCheckInConditionField.options.choices.map(x => x.name) : null
    const logConditions = logCheckInConditions && logCheckOutConditions ? logCheckOutConditions.filter(x => logCheckInConditions.includes(x)) : null
    // Return the single select options found in all three conditions fields, prevents errors thrown if trying to copy an incompatable option from another field
    const sharedConditions = unitsConditions && logConditions ? unitsConditions.filter(x => logConditions.includes(x)) : null
    const bestCondition = sharedConditions ? sharedConditions[0] : null
    
    const today = new Date()
    
    // Collect info from record button type press
    const recordActionData = useRecordActionData();
    
    const tableId = recordActionData ? recordActionData.tableId : null
    const table = base.getTableByIdIfExists(tableId)
    const tableName = table ? table.name : null
    const recordId = recordActionData ? recordActionData.recordId : null
    const record = useRecordById(table, recordId)
    
    // The "mode" determines what action buttons are shown, and the variables used in the async functions
    const modes = [itemsTableId, unitsTableId, logTableId]
    const mode = modes.indexOf(tableId)
    
    // Items Actions (variables and functions for use in the action buttons)
    const unitsRecordsLinkedToItem = useRecords(record && mode == 0 ? record.selectLinkedRecordsFromCell(itemsLinkUnitsField) : null)
    // Returns records which are available (determined by presence in a view), and which have a Condition cell value that can be used in the other two condition fields
    const availableLinkedUnits = unitsRecordsLinkedToItem ? 
          unitsRecordsLinkedToItem.filter(x => availableUnits.map(y => y.id).includes(x.id) && sharedConditions.includes(x.getCellValue(unitsConditionFieldId).name)) : null
    const anyAvailable = availableLinkedUnits != null && availableLinkedUnits.length ? true : false
    const bestAvailable = availableLinkedUnits ? 
          availableLinkedUnits.sort((a, b) => (sharedConditions.indexOf(a.getCellValue(unitsConditionFieldId).name) > sharedConditions.indexOf(b.getCellValue(unitsConditionFieldId).name)) ? 1 : -1)[0] : null
    
    // Units Actions (variables and functions for use in the action buttons)
    const logRecordsLinkedToUnit = useRecords(record && mode == 1 ? record.selectLinkedRecordsFromCell(unitsLinkLogField) : null)
    const checkedOutRecordssLinkedToUnit = logRecordsLinkedToUnit ? logRecordsLinkedToUnit.filter(x => checkedOutRecords.map(y => y.id).includes(x.id)) : null
    const recordIsAvailable = mode == 1 && availableUnits.map(y => y.id).includes(record.id) ? true : false
    const hasHistory = logRecordsLinkedToUnit != null && logRecordsLinkedToUnit.length ? true : false
    
    const checkCanCreateUnit = unitsTable ? unitsTable.checkPermissionsForCreateRecord() : null
    const checkCanUpdateUnit = unitsTable ? unitsTable.checkPermissionsForUpdateRecord() : null
    
    async function createNewUnit() {
        const newRecordId = await unitsTable.createRecordAsync({
            [unitsLinkItemsFieldId]: [{id: record.id}],
            [unitsConditionFieldId]: {name: bestCondition},
            [unitsPurchaseDateFieldId]: today
        })
        const query = await unitsTable.selectRecordsAsync()
        expandRecord(query.getRecordById(newRecordId))
        query.unloadData()
    }
    
    // Log Actions (variables and functions for use in the action buttons)
    const conditionsChoices = sharedConditions ? sharedConditions.map(x => {return ({value: x, label: x})}) : null
    const recordIsResolved = mode == 2 && checkedOutRecords.map(y => y.id).includes(record.id) ? false : true
    const unitsRecordsLinkedToLog = useRecords(record && mode == 2 ? record.selectLinkedRecordsFromCell(logLinkUnitsFieldId) : null)
    
    const checkCanCreateLog = logTable ? logTable.checkPermissionsForCreateRecord() : null
    
    async function viewHistory() {
        const recordA = await expandRecordList(logRecordsLinkedToUnit)
    }
    
    async function checkOutUnitAuto() {
        const logCheckOutInput = mode == 0 ? bestAvailable : record
        const newRecordId = await logTable.createRecordAsync({
            [logLinkUnitsFieldId]: [{id: logCheckOutInput.id}],
            [logCheckOutDateFieldId]: today,
            [logCheckOutConditionFieldId]: {name: logCheckOutInput.getCellValue(unitsConditionFieldId).name}
        })
        const query = await logTable.selectRecordsAsync()
        expandRecord(query.getRecordById(newRecordId))
        query.unloadData()
    }

    async function checkOutUnitSelect() {
        const logCheckOutInput = await expandRecordPickerAsync(availableLinkedUnits)
        if (logCheckOutInput) {
            const newRecordId = await logTable.createRecordAsync({
                [logLinkUnitsFieldId]: [{id: logCheckOutInput.id}],
                [logCheckOutDateFieldId]: today,
                [logCheckOutConditionFieldId]: {name: logCheckOutInput.getCellValue(unitsConditionFieldId).name}
            })
            const query = await logTable.selectRecordsAsync()
            expandRecord(query.getRecordById(newRecordId))
            query.unloadData()
        }
    }
    
    const checkCanUpdateLog = logTable ? logTable.checkPermissionsForUpdateRecord() : null
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newCondition, setNewCondition] = useState(null);
    
    async function checkInUnit() {
        const logCheckInInput = mode == 2 ? record : checkedOutRecordssLinkedToUnit[0]
        await logTable.updateRecordAsync(logCheckInInput, {
            [logCheckInDateFieldId]: today,
            [logCheckInConditionFieldId]: {name: newCondition},
        })
        const unitInput = mode == 2 ? unitsRecordsLinkedToLog[0] : record
        await unitsTable.updateRecordAsync(unitInput, {
            [unitsConditionFieldId]: {name: newCondition}
        })
        setNewCondition(null)
        setIsDialogOpen(false)
    }
    
    // Display the settings module if setup is required
    if (isShowingSettings) {
        return (
            <React.Fragment>
                <BlockContainer>
                    <SettingsMenu
                        globalConfig={globalConfig}
                        GlobalConfigKeys={GlobalConfigKeys}
                        base={base}
                        initialSetupDone={initialSetupDone}
                        onDoneClick={() => setIsShowingSettings(false)}
                    />
                </BlockContainer>
            </React.Fragment>
        )
    } else if(recordActionData && mode == 0) {
        return (
            <React.Fragment>
                <AssistantContent table={table} record={record}>
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
                </AssistantContent>
            </React.Fragment>
        )
    } else if(recordActionData && mode == 1) {
        return (
            <React.Fragment>
                <AssistantContent table={table} record={record}>
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
                        buttonAction={() => setIsDialogOpen(true)}
                        buttonText="Check in"
                    />
                    
                    {isDialogOpen && (
                        <Dialog onClose={() => setIsDialogOpen(false)} width="320px">
                            <Dialog.CloseButton />
                            <FormField label="What condition is the unit in?" marginBottom={2}>
                                <Select options={conditionsChoices} value={newCondition} onChange={newValue => setNewCondition(newValue)} />
                            </FormField>
                            <Button variant="primary" icon="check" onClick={checkInUnit}>Done</Button>
                        </Dialog>
                    )}
                </AssistantContent>
            </React.Fragment>
        )
    } else if(recordActionData && mode == 2) {
        return (
            <React.Fragment>
                <AssistantContent table={table} record={record}>
                    <ActionButton
                        disabledCondition={!checkCanUpdateLog.hasPermission || recordIsResolved}
                        tooltipContent={!checkCanUpdateLog.hasPermission ? checkCanUpdateLog.reasonDisplayString : "Record is already resolved"}
                        buttonIcon="checkboxChecked"
                        buttonAction={() => setIsDialogOpen(true)}
                        buttonText="Check in"
                    />
                    {isDialogOpen && (
                        <Dialog onClose={() => setIsDialogOpen(false)} width="320px">
                            <Dialog.CloseButton />
                            <FormField label="What condition is the unit in?" marginBottom={2}>
                                <Select options={conditionsChoices} value={newCondition} onChange={newValue => setNewCondition(newValue)} />
                            </FormField>
                            <Button variant="primary" icon="check" onClick={checkInUnit}>Done</Button>
                        </Dialog>
                    )}
                </AssistantContent>
            </React.Fragment>
        )
    } else {
        return (
            <React.Fragment>
                <BlockContainer>
                    <Box padding={3} backgroundColor="lightGray1" border="thick" borderRadius="large" maxWidth="500px">
                        <Box display="flex" alignItems="center" marginBottom={3}>                    
                            <Icon name="warning" fillColor="orange" marginRight={3} />
                            <Heading margin={0} flex="1 1" variant="caps">Click an action button</Heading>
                        </Box>
                        <Text size="large" textColor="light">Use an action button in the base to run this block.</Text>
                    </Box>
                </BlockContainer>
            </React.Fragment>
        )
    }
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

function AssistantContent({children, table, record}) {
    const truncateText= {overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}
    return (
        <React.Fragment>
            <BlockContainer>
                <Box display="flex" flex="1 1" flexWrap="wrap" width="100%" justifyContent="space-between" paddingBottom={3} borderBottom="thick">
                    <Box marginX={4} style={truncateText}>
                        <Heading variant="caps" size="xsmall" textColor="light">Table</Heading>
                        <Heading size="small" style={truncateText}>{table.name}</Heading>
                    </Box>
                    <Box marginX={4} flex="1 1" style={truncateText}>
                        <Heading variant="caps" size="xsmall" textColor="light">Record</Heading>
                        <Heading size="small" style={truncateText}>{record.name}</Heading>
                    </Box>
                </Box>
                <RecordCard record={record} marginY={4} />
                <Box display="flex" flexWrap="wrap" justifyContent="center">
                    {children}
                </Box>
            </BlockContainer>
        </React.Fragment>
    )
}

function SettingsMenu(props) {
    const base = props.base
    
    const unitsTableId = props.GlobalConfigKeys.UNITS_TABLE_ID
    const unitsTable = base.getTableByIdIfExists(props.globalConfig.get(unitsTableId))
    const unitsViewId = props.GlobalConfigKeys.UNITS_VIEW_ID
    const unitsConditionFieldId = props.GlobalConfigKeys.UNITS_CONDITION_FIELD_ID
    const unitsPurchaseDateFieldId = props.GlobalConfigKeys.UNITS_PURCHASE_DATE_FIELD_ID
    const unitsLinkItemsFieldId = props.GlobalConfigKeys.UNITS_LINK_ITEMS_FIELD_ID
    const unitsLinkLogFieldId = props.GlobalConfigKeys.UNITS_LINK_LOG_FIELD_ID
    const unitsTrackItems = props.GlobalConfigKeys.UNITS_TRACK_ITEMS
    const unitsTrackCondition = props.GlobalConfigKeys.UNITS_TRACK_CONDITION
    const unitsTrackOriginDate = props.GlobalConfigKeys.UNITS_TRACK_ORIGIN_DATE
    
    const logTableId = props.GlobalConfigKeys.LOG_TABLE_ID
    const logTable = base.getTableByIdIfExists(props.globalConfig.get(logTableId))
    const logViewId = props.GlobalConfigKeys.LOG_VIEW_ID
    const logCheckOutConditionFieldId = props.GlobalConfigKeys.LOG_OUT_CONDITION_FIELD_ID
    const logCheckOutDateFieldId = props.GlobalConfigKeys.LOG_OUT_DATE_FIELD_ID
    const logCheckInConditionFieldId = props.GlobalConfigKeys.LOG_IN_CONDITION_FIELD_ID
    const logCheckInDateFieldId = props.GlobalConfigKeys.LOG_IN_DATE_FIELD_ID
    
    const resetUnitsFields = () => {
        const paths = [
            {path: [unitsViewId], value: null},
            {path: [unitsConditionFieldId], value: null},
            {path: [unitsPurchaseDateFieldId], value: null},
            {path: [unitsLinkItemsFieldId], value: null},
            {path: [unitsLinkLogFieldId], value: null},
            {path: [unitsTrackItems], value: null},
            {path: [unitsTrackCondition], value: null},
            {path: [unitsTrackOriginDate], value: null}
        ]
        props.globalConfig.setPathsAsync(paths);
    }
    const resetLogFields = () => {
        const paths = [
            {path: [logCheckOutConditionFieldId], value: null},
            {path: [logCheckOutDateFieldId], value: null},
            {path: [logCheckOutDateFieldId], value: null},
            {path: [logCheckInConditionFieldId], value: null},
            {path: [logCheckInDateFieldId], value: null},
        ]
        props.globalConfig.setPathsAsync(paths);
    }
    
    return(
        <React.Fragment>
            <Heading marginBottom={4}>Inventory assistant settings</Heading>
            <Box alignSelf="stretch">
                <Box margin={-2}  display="flex" flexWrap="wrap">
                    <Box border="thick" borderRadius="large" flex="1 1" margin={2} padding={3}>
                        <Heading size="small">Units</Heading>
                        <FormField label="Units table" description="Table containing the individual items which are bought/rented" marginY={2}>
                            <TablePickerSynced 
                                globalConfigKey={unitsTableId}
                                onChange={resetUnitsFields}
                            />
                        </FormField>
                        <FormField label="Available units view" description="A view which shows all currently available units" marginY={2}>
                            <ViewPickerSynced 
                                globalConfigKey={unitsViewId}
                                table={unitsTable}
                            />
                        </FormField>
                        <FormField label="Log link" description="Field linking to the log table" marginY={2}>
                            <FieldPickerSynced
                                globalConfigKey={unitsLinkLogFieldId}
                                table={unitsTable}
                                allowedTypes={[
                                    FieldType.MULTIPLE_RECORD_LINKS
                                ]}
                            />
                        </FormField>
                        <Heading borderTop="thick" paddingTop={2} textColor="light" size="xsmall" marginY={3}>Optional fields</Heading>
                        <Box display="flex" marginY={2}>
                            <SwitchSynced globalConfigKey={unitsTrackItems} label="Linked to a table of types/groups?" marginRight={2} />
                            <FieldPickerSynced
                                globalConfigKey={unitsLinkItemsFieldId}
                                table={unitsTable}
                                allowedTypes={[
                                    FieldType.MULTIPLE_RECORD_LINKS
                                ]}
                                marginLeft={2}
                            />
                        </Box>
                        <Box display="flex" marginY={2}>
                            <SwitchSynced globalConfigKey={unitsTrackCondition} label="Track unit condition?" marginRight={2} />
                            <FieldPickerSynced
                                globalConfigKey={unitsConditionFieldId}
                                table={unitsTable}
                                allowedTypes={[
                                    FieldType.SINGLE_SELECT
                                ]}
                                marginLeft={2}
                            />
                        </Box>
                        <Box display="flex" marginY={2}>
                            <SwitchSynced globalConfigKey={unitsTrackOriginDate} label="Track origin date?" marginRight={2} />
                            <FieldPickerSynced
                                globalConfigKey={unitsPurchaseDateFieldId}
                                table={unitsTable}
                                allowedTypes={[
                                    FieldType.DATE,
                                    FieldType.DATE_TIME
                                ]}
                                marginLeft={2}
                            />
                        </Box>
                    </Box>
                    <Box border="thick" borderRadius="large" flex="1 1" margin={2} padding={3}>
                        <Heading size="small">Log</Heading>
                        <FormField label="Log table" description="Table containing the records detailing each units item's history" marginY={2}>
                            <TablePickerSynced 
                                globalConfigKey={logTableId}
                                onChange={resetLogFields}
                            />
                        </FormField>
                        <FormField label="Checked out view" description="A view which shows all checked out records" marginY={2}>
                            <ViewPickerSynced 
                                globalConfigKey={logViewId}
                                table={logTable}
                            />
                        </FormField>
                        <FormField label="Check out date field" description="Field describing the date the unit was rented" marginY={2}>
                            <FieldPickerSynced
                                globalConfigKey={logCheckOutDateFieldId}
                                table={logTable}
                                allowedTypes={[
                                    FieldType.DATE,
                                    FieldType.DATE_TIME
                                ]}
                            />
                        </FormField>
                        <FormField label="Check in date field" description="Field describing the date the unit was returned" marginY={2}>
                            <FieldPickerSynced
                                globalConfigKey={logCheckInDateFieldId}
                                table={logTable}
                                allowedTypes={[
                                    FieldType.DATE,
                                    FieldType.DATE_TIME
                                ]}
                            />
                        </FormField>
                        <Heading borderTop="thick" paddingTop={2} textColor="light" size="xsmall" marginY={3}>Optional fields</Heading>
                        <FormField label="Condition upon check out field" marginY={2}>
                            <FieldPickerSynced
                                globalConfigKey={logCheckOutConditionFieldId}
                                table={logTable}
                                allowedTypes={[
                                    FieldType.SINGLE_SELECT
                                ]}
                            />
                        </FormField>
                        <FormField label="Condition upon check in field" marginY={2}>
                            <FieldPickerSynced
                                globalConfigKey={logCheckInConditionFieldId}
                                table={logTable}
                                allowedTypes={[
                                    FieldType.SINGLE_SELECT
                                ]}
                            />
                        </FormField>
                    </Box>
                </Box>
            </Box>
            <Box display="flex" marginTop={4}>
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
        </React.Fragment>
    )
}

function BlockContainer({children}) {
    return (
        <div id="Units-Assistant-Block" width="100%" height="100vh">
            <ViewportConstraint minSize={{width: 632, height: 200}}>
                <Box padding={4} display="flex" flexDirection="column" alignItems="center" justifyContent="center" width="100%" height="100%" overflow="hidden">
                    {children}
                </Box>
            </ViewportConstraint>
        </div>
    )
}

initializeBlock(() => <InventoryAssistantBlock />);
