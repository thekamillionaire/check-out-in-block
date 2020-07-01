import {
    initializeBlock,
    useBase,
    useRecords,
    useGlobalConfig,
    useSettingsButton,
    useRecordById,
    useRecordActionData,
    Box,
    Heading,
    Icon,
    TablePickerSynced,
    ViewPickerSynced,
    FieldPickerSynced,
    expandRecord,
    expandRecordList,
    expandRecordPickerAsync,
    RecordCard,
    FormField,
    Button,
    Text,
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
        ITEMS_TABLE_ID: "itemsTableId",
        ITEMS_LINK_UNITS_FIELD_ID: "itemsLinkUnitsFieldId",
        UNITS_TABLE_ID: "unitsTableId",
        UNITS_VIEW_ID: "unitsViewId",
        UNITS_CONDITION_FIELD_ID: "unitsConditionFieldId",
        UNITS_PURCHASE_DATE_FIELD_ID: "unitsPurchaseDateFieldId",
        UNITS_LINK_LOG_FIELD_ID: "unitsLinkLogFieldId",
        LOG_TABLE_ID: "logTableId",
        LOG_VIEW_ID: "logViewId",
        LOG_OUT_CONDITION_FIELD_ID: "logCheckOutConditionFieldId",
        LOG_OUT_DATE_FIELD_ID: "logCheckOutDateFieldId",
        LOG_IN_CONDITION_FIELD_ID: "logCheckInConditionFieldId",
        LOG_IN_DATE_FIELD_ID: "logCheckInDateFieldId"
    }
    
    const itemsTableId = globalConfig.get(GlobalConfigKeys.ITEMS_TABLE_ID)
    const itemsLinkUnitsFieldId = globalConfig.get(GlobalConfigKeys.ITEMS_LINK_UNITS_FIELD_ID)
    
    const unitsTableId = globalConfig.get(GlobalConfigKeys.UNITS_TABLE_ID)
    const unitsViewId = globalConfig.get(GlobalConfigKeys.UNITS_VIEW_ID)
    const unitsConditionFieldId = globalConfig.get(GlobalConfigKeys.UNITS_CONDITION_FIELD_ID)
    const unitsPurchaseDateFieldId = globalConfig.get(GlobalConfigKeys.UNITS_PURCHASE_DATE_FIELD_ID)
    const unitsLinkLogFieldId = globalConfig.get(GlobalConfigKeys.UNITS_LINK_LOG_FIELD_ID)
    
    const logTableId = globalConfig.get(GlobalConfigKeys.LOG_TABLE_ID)
    const logViewId = globalConfig.get(GlobalConfigKeys.LOG_VIEW_ID)
    const logCheckOutConditionFieldId = globalConfig.get(GlobalConfigKeys.LOG_OUT_CONDITION_FIELD_ID)
    const logCheckOutDateFieldId = globalConfig.get(GlobalConfigKeys.LOG_OUT_DATE_FIELD_ID)
    const logCheckInConditionFieldId = globalConfig.get(GlobalConfigKeys.LOG_IN_CONDITION_FIELD_ID)
    const logCheckInDateFieldId = globalConfig.get(GlobalConfigKeys.LOG_IN_DATE_FIELD_ID)
    
    // Check if all settings options have values
    const initialSetupDone = itemsTableId && itemsLinkUnitsFieldId && unitsTableId && unitsViewId && unitsConditionFieldId && unitsPurchaseDateFieldId && unitsPurchaseDateFieldId && unitsLinkLogFieldId && logTableId && logViewId && logCheckOutConditionFieldId && logCheckOutDateFieldId && logCheckInConditionFieldId && logCheckInDateFieldId ? true : false
    
    // Get tables, view ids, and field ids
    const itemsTable = base.getTableByIdIfExists(itemsTableId)
    const itemsLinkUnitsField = itemsTable ? itemsTable.getFieldIfExists(itemsLinkUnitsFieldId) : null
    
    const unitsTable = base.getTableByIdIfExists(unitsTableId)
    const unitsView = unitsTable ? unitsTable.getViewByIdIfExists(unitsViewId) : null
    const availableUnits = useRecords(unitsView)
    const unitsLinkItemsFieldId = itemsLinkUnitsField ? itemsLinkUnitsField.options.inverseLinkFieldId : null
    const unitsConditionsField = unitsTable ? unitsTable.getFieldIfExists(unitsConditionFieldId) : null
    const unitsConditions = unitsConditionsField ? unitsConditionsField.options.choices.map(x => x.name) : null
    const unitsLinkLogField = unitsTable ? unitsTable.getFieldIfExists(unitsLinkLogFieldId) : null
    const bestCondition = unitsConditions ? unitsConditions[0] : null
    
    const logTable = base.getTableByIdIfExists(logTableId)
    const logView = logTable ? logTable.getViewByIdIfExists(logViewId) : null
    const unresolvedLog = useRecords(logView)
    const logLinkUnitsFieldId = unitsLinkLogField ? unitsLinkLogField.options.inverseLinkFieldId : null
    
    const today = new Date()
    
    // Enable the settings button
    const [isShowingSettings, setIsShowingSettings] = useState(!initialSetupDone);
    useSettingsButton(function() {
        initialSetupDone && setIsShowingSettings(!isShowingSettings);
    });
    
    // Collect info from record button type press
    const recordActionData = useRecordActionData();
    
    const tableId = recordActionData ? recordActionData.tableId : null
    const table = base.getTableByIdIfExists(tableId)
    const tableName = table ? table.name : null
    const recordId = recordActionData? recordActionData.recordId : null
    const record = useRecordById(table, recordId)
    
    // The "mode" determines what action buttons are shown, and the variables used in the async functions
    const modes = [itemsTableId, unitsTableId, logTableId]
    const mode = modes.indexOf(tableId)
    
    // Items Actions (variables and functions for use in the action buttons)
    const linkedUnits = useRecords(record && mode == 0 ? record.selectLinkedRecordsFromCell(itemsLinkUnitsField) : null)
    const availableLinkedUnits = linkedUnits ? linkedUnits.filter(x => availableUnits.map(y => y.id).includes(x.id)) : null
    const anyAvailable = availableLinkedUnits != null && availableLinkedUnits.length > 0 ? true : false
    const bestAvailable = availableLinkedUnits ? availableLinkedUnits.sort((a, b) => (unitsConditions.indexOf(a.getCellValue(unitsConditionFieldId).name) > unitsConditions.indexOf(b.getCellValue(unitsConditionFieldId).name)) ? 1 : -1)[0] : null
    
    // Units Actions (variables and functions for use in the action buttons)
    const linkedLog = useRecords(record && mode == 1 ? record.selectLinkedRecordsFromCell(unitsLinkLogField) : null)
    const unresolvedLinkedLog = linkedLog ? linkedLog.filter(x => unresolvedLog.map(y => y.id).includes(x.id)) : null
    const recordIsAvailable = mode == 1 && availableUnits.map(y => y.id).includes(record.id) ? true : false
    const hasHistory = linkedLog != null && linkedLog.length > 0 ? true : false
    
    const checkCanCreateUnit = unitsTable ? unitsTable.checkPermissionsForCreateRecord() : null
    
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
    const recordIsResolved = mode == 2 && unresolvedLog.map(y => y.id).includes(record.id) ? false : true
    
    const checkCanCreateLog = logTable ? logTable.checkPermissionsForCreateRecord() : null
    
    async function viewHistory() {
        const recordA = await expandRecordList(linkedLog)
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
    
    async function checkInUnit() {
        const logCheckInInput = mode == 2 ? record : unresolvedLinkedLog[0]
        const updatedRecordId = await logTable.updateRecordAsync(logCheckInInput, {
            [logCheckInDateFieldId]: today
        })
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
                        buttonAction={checkInUnit}
                        buttonText="Check in"
                    />
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
                        buttonAction={checkInUnit}
                        buttonText="Check in"
                    />
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
    
    const itemsTableId = props.GlobalConfigKeys.ITEMS_TABLE_ID
    const itemsTable = base.getTableByIdIfExists(props.globalConfig.get(itemsTableId))
    const itemsLinkUnits = props.GlobalConfigKeys.ITEMS_LINK_UNITS_FIELD_ID
    
    const unitsTableId = props.GlobalConfigKeys.UNITS_TABLE_ID
    const unitsTable = base.getTableByIdIfExists(props.globalConfig.get(unitsTableId))
    const unitsViewId = props.GlobalConfigKeys.UNITS_VIEW_ID
    const unitsConditionFieldId = props.GlobalConfigKeys.UNITS_CONDITION_FIELD_ID
    const unitsPurchaseDateFieldId = props.GlobalConfigKeys.UNITS_PURCHASE_DATE_FIELD_ID
    const unitsLinkLogFieldId = props.GlobalConfigKeys.UNITS_LINK_LOG_FIELD_ID
    
    const logTableId = props.GlobalConfigKeys.LOG_TABLE_ID
    const logTable = base.getTableByIdIfExists(props.globalConfig.get(logTableId))
    const logViewId = props.GlobalConfigKeys.LOG_VIEW_ID
    const logCheckOutConditionFieldId = props.GlobalConfigKeys.LOG_OUT_CONDITION_FIELD_ID
    const logCheckOutDateFieldId = props.GlobalConfigKeys.LOG_OUT_DATE_FIELD_ID
    const logCheckInConditionFieldId = props.GlobalConfigKeys.LOG_IN_CONDITION_FIELD_ID
    const logCheckInDateFieldId = props.GlobalConfigKeys.LOG_IN_DATE_FIELD_ID
    
    const resetItemsFields = () => {
        const paths = [
            {path: [itemsLinkUnits], value: null}
        ]
        props.globalConfig.setPathsAsync(paths);
    }
    const resetUnitsFields = () => {
        const paths = [
            {path: [unitsViewId], value: null},
            {path: [unitsConditionFieldId], value: null},
            {path: [unitsPurchaseDateFieldId], value: null},
            {path: [unitsLinkLogFieldId], value: null}
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
            <Heading marginBottom={4}>Units assistant settings</Heading>
            <Box alignSelf="stretch">
                <Box margin={-2}  display="flex" flexDirection="row" flexWrap="wrap">
                    <Box border="thick" borderRadius="large" flex="1 1" margin={2} padding={3}>
                        <Heading size="small">Items</Heading>
                        <FormField label="Items table" description="Table containing the types of items" marginY={2}>
                            <TablePickerSynced 
                                globalConfigKey={itemsTableId}
                                onChange={resetItemsFields}
                            />
                        </FormField>
                        <FormField label="Units link" description="Field linking to the units table" marginY={2}>
                            <FieldPickerSynced
                                globalConfigKey={itemsLinkUnits}
                                table={itemsTable}
                                allowedTypes={[
                                    FieldType.MULTIPLE_RECORD_LINKS
                                ]}
                            />
                        </FormField>
                    </Box>
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
                        <FormField label="Condition field" description="Field describing an unit's current condition" marginY={2}>
                            <FieldPickerSynced
                                globalConfigKey={unitsConditionFieldId}
                                table={unitsTable}
                            />
                        </FormField>
                        <FormField label="Purchase date field" description="Field detailing when an unit was purchased/added to the units" marginY={2}>
                            <FieldPickerSynced
                                globalConfigKey={unitsPurchaseDateFieldId}
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
                    </Box>
                    <Box border="thick" borderRadius="large" flex="1 1" margin={2} padding={3}>
                        <Heading size="small">Log</Heading>
                        <FormField label="Log table" description="Table containing the records detailing each units item's history" marginY={2}>
                            <TablePickerSynced 
                                globalConfigKey={logTableId}
                                onChange={resetLogFields}
                            />
                        </FormField>
                        <FormField label="Unresolved view" description="A view which shows all 'open' records" marginY={2}>
                            <ViewPickerSynced 
                                globalConfigKey={logViewId}
                                table={logTable}
                            />
                        </FormField>
                        <FormField label="Original condition field" description="Field describing the unit's condition when received" marginY={2}>
                            <FieldPickerSynced
                                globalConfigKey={logCheckOutConditionFieldId}
                                table={logTable}
                            />
                        </FormField>
                        <FormField label="Date out field" description="Field describing the date the unit was rented" marginY={2}>
                            <FieldPickerSynced
                                globalConfigKey={logCheckOutDateFieldId}
                                table={logTable}
                            />
                        </FormField>
                        <FormField label="Returned condition field" description="Field describing the unit's condition when returned" marginY={2}>
                            <FieldPickerSynced
                                globalConfigKey={logCheckInConditionFieldId}
                                table={logTable}
                            />
                        </FormField>
                        <FormField label="Date in field" description="Field describing the date the unit was returned" marginY={2}>
                            <FieldPickerSynced
                                globalConfigKey={logCheckInDateFieldId}
                                table={logTable}
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
