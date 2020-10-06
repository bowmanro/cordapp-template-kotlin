import React, {useEffect, useState} from "react";
import {
    FormControl,
    InputLabel,
    MenuItem,
    FormHelperText,
    TextField,
    Select,
    Button,
    Grid,
    withStyles
} from "@material-ui/core";
import {lightGreen, pink} from "@material-ui/core/colors";
import http from "../services/http";
import urls, {COMPLETED_FLOWS, NODE_ID} from "../services/urls";
import '../styling/FlowParameters.css';
import {trimFlowsForDisplay} from "./Flows";
import createPersistedState from 'use-persisted-state';
import {getPartyNameAndFlag} from "./NetworkParticipants"


function FlowParameters({registeredFlow, toggleModal}) {
    const [ flowData, setFlowData ] = useState({
        activeConstructor: "",
        parties: [],
        flowParams: [],
        paramList: [registeredFlow.flowParams]
    })
    const useCompletedFlowState = createPersistedState(COMPLETED_FLOWS)
    const [completedFlows, setCompletedFlows] = useCompletedFlowState([])

    const [isFlowSuccessful, setFlowSuccessful] = useState(false)
    const [isFlowInProgress, setFlowInProgress] = useState(false)
    const [showFlowResult, setShowFlowResult] = useState(false)

    function renderParamForm(innerForm, paramList, title, deep, delIdx, param, key) {
        return (
            <React.Fragment key={key}>
                {
                    innerForm ?
                        <div className="inner-form" style={{padding: deep ? "10px 0px 0px 0px" : "10px 0"}} key={key}>
                            {
                                delIdx >= 0 ? <div className="inner-form-close"
                                                   onClick={() => updateCmplxListParam(param, false, delIdx)}>X</div> : null
                            }
                            <div style={{padding: deep ? 0 : "0 10px"}}>
                                <div style={{textTransform: "capitalize"}}><strong>{title}</strong></div>
                                {
                                    paramList.map((param, index) => renderInnerForm(param, index, true))
                                }
                            </div>
                        </div>
                        :
                        flowData.flowParams.map((param, index) => renderInnerForm(param, index, false))
                }
            </React.Fragment>
        );
    }

    function renderInnerForm(param, index, deep) {
        return (
            param.flowParams && param.flowParams.length > 1 && !(param.hasParameterizedType && (param.paramType === 'java.util.List' || param.paramType === 'java.util.Set')) ?
                renderParamForm(true, param.flowParams, param.paramName, deep)
                : // List of complex object
                param.flowParams && param.flowParams.length > 1 && (param.hasParameterizedType && (param.paramType === 'java.util.List' || param.paramType === 'java.util.Set')) ?
                    <>
                        <div style={{color: 'red', marginTop: 10}}>List of Complex Object is not supported</div>
                    </>
                    :
                    <React.Fragment key={index}>
                        <div key={index} style={{width: "50%", float: "left", marginBottom: 5}}>
                            {
                                param.paramType === 'net.corda.core.identity.Party' ?
                                    <div style={{
                                        paddingRight: index % 2 === 0 ? 5 : 0,
                                        paddingLeft: index % 2 === 1 ? 5 : 0
                                    }}>
                                        <FormControl fullWidth>
                                            <InputLabel>{param.paramName}</InputLabel>
                                            <Select
                                                onChange={e => {
                                                    param.paramValue = e.target.value
                                                }} autoWidth defaultValue={''}>
                                                {

                                                    getParties().map((party, index) => {
                                                        return (
                                                            <MenuItem key={index}
                                                                      value={party + ''}>{getPartyNameAndFlag(party)}</MenuItem>
                                                        );
                                                    })
                                                }
                                            </Select>
                                            <FormHelperText>Select Party</FormHelperText>
                                        </FormControl>
                                    </div>
                                    :
                                    param.paramType === 'java.time.LocalDateTime' || param.paramType === 'java.time.Instant' ?
                                        <div style={{
                                            paddingRight: index % 2 === 0 ? 10 : 0,
                                            paddingLeft: index % 2 === 1 ? 5 : 0
                                        }}>
                                            <TextField type="datetime-local" onBlur={e => {
                                                param.paramValue = e.target.value
                                            }} label={param.paramName} InputLabelProps={{shrink: true, margin: 'dense'}}
                                                       helperText={getHelperText(param.paramType)} fullWidth/>
                                        </div>
                                        :
                                        param.paramType === 'java.time.LocalDate' ?
                                            <div style={{
                                                paddingRight: index % 2 === 0 ? 10 : 0,
                                                paddingLeft: index % 2 === 1 ? 5 : 0
                                            }}>
                                                <TextField type="date" onBlur={e => {
                                                    param.paramValue = e.target.value
                                                }} label={param.paramName}
                                                           InputLabelProps={{shrink: true, margin: 'dense'}} fullWidth/>
                                            </div>
                                            :
                                            param.hasParameterizedType && (param.paramType === 'java.util.List' || param.paramType === 'java.util.Set') ?
                                                renderListParam(param, index)
                                                :
                                                <div style={{
                                                    paddingRight: index % 2 === 0 ? 10 : 0,
                                                    paddingLeft: index % 2 === 1 ? 5 : 0
                                                }}>
                                                    <TextField onBlur={e => {
                                                        param.paramValue = e.target.value
                                                    }} label={param.paramName}
                                                               InputLabelProps={{shrink: true, margin: 'dense'}}
                                                               helperText={getHelperText(param.paramType)} fullWidth/>
                                                </div>
                            }
                        </div>
                        {
                            index % 2 === 1 ? <div style={{clear: "both"}}></div> : null
                        }
                    </React.Fragment>
        );
    }

    function renderListParam(param, index) {
        return (
            <div style={{paddingRight: index % 2 === 0 ? 5 : 0, paddingLeft: index % 2 === 1 ? 5 : 0}}>
                {
                    param.parameterizedType === 'net.corda.core.identity.Party' ?
                        <React.Fragment>
                            <FormControl fullWidth>
                                <InputLabel>{param.paramName}</InputLabel>
                                <Select onChange={e => updateListParam(param, e.target.value, true)} autoWidth
                                        defaultValue={''}>
                                    {
                                        getParties().map((party, index) => {
                                            return (
                                                <MenuItem key={index}
                                                          value={party}>{getPartyNameAndFlag(party)}</MenuItem>
                                            );
                                        })
                                    }
                                </Select>
                                <FormHelperText>Select Parties</FormHelperText>
                            </FormControl>
                            {
                                flowData.paramList[param.paramName] ?
                                    flowData.paramList[param.paramName].map((value, idx) => {
                                        return (
                                            <div key={idx} className="list-selection">{getPartyNameAndFlag(value)}<span
                                                onClick={() => updateListParam(param, "", false, idx)}>X</span></div>)
                                    })
                                    : null
                            }
                        </React.Fragment>
                        : param.parameterizedType === 'java.time.LocalDateTime' || param.parameterizedType === 'java.time.Instant' ?
                        <React.Fragment>
                            <div style={{paddingRight: index % 2 === 0 ? 5 : 0, paddingLeft: index % 2 === 1 ? 5 : 0}}>
                                <TextField type="datetime-local"
                                           onBlur={e => updateListParam(param, e.target.value, true)}
                                           label={param.paramName} InputLabelProps={{shrink: true}}
                                           helperText={getHelperText(param.paramType)} fullWidth/>
                            </div>
                            {
                                flowData.paramList[param.paramName] ?
                                    flowData.paramList[param.paramName].map((value, idx) => {
                                        return (<div key={idx} className="list-selection">{value}<span
                                            onClick={() => updateListParam(param, "", false, idx)}>X</span></div>)
                                    })
                                    : null
                            }
                        </React.Fragment>
                        :
                        param.parameterizedType === 'java.time.LocalDate' ?
                            <React.Fragment>
                                <div style={{
                                    paddingRight: index % 2 === 0 ? 5 : 0,
                                    paddingLeft: index % 2 === 1 ? 5 : 0
                                }}>
                                    <TextField type="date" onBlur={e => updateListParam(param, e.target.value, true)}
                                               label={param.paramName} InputLabelProps={{shrink: true}} fullWidth/>
                                </div>
                                {
                                    flowData.paramList[param.paramName] ?
                                        flowData.paramList[param.paramName].map((value, idx) => {
                                            return (<div key={idx} className="list-selection">{value}<span
                                                onClick={() => updateListParam(param, "", false, idx)}>X</span></div>)
                                        })
                                        : null
                                }
                            </React.Fragment>
                            :
                            param.hasParameterizedType && (param.paramType === 'java.util.List' || param.paramType === 'java.util.Set') ?
                                <div style={{color: 'red', marginTop: 10}}>Nested List Param is not supported!</div>
                                :
                                <React.Fragment>
                                    <div style={{
                                        paddingRight: index % 2 === 0 ? 5 : 0,
                                        paddingLeft: index % 2 === 1 ? 5 : 0
                                    }}>
                                        <TextField onBlur={e => updateListParam(param, e.target.value, true)}
                                                   label={param.paramName} helperText={getHelperText(param.paramType)}
                                                   fullWidth/>
                                    </div>
                                    {
                                        flowData.paramList[param.paramName] ?
                                            flowData.paramList[param.paramName].map((value, idx) => {
                                                return (<div key={idx} className="list-selection">{value}<span
                                                    onClick={() => updateListParam(param, "", false, idx)}>X</span>
                                                </div>)
                                            })
                                            : null
                                    }
                                </React.Fragment>
                }
            </div>
        );
    }

    return (
        <div>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <div style={{width: "30%", float: "left"}}>
                        <FormControl style={{width: "100%"}}>
                            <div style={{paddingLeft: 10}}>
                                <InputLabel id="flow-cons-select-label" style={{paddingLeft: 10}}>Select A Constructor
                                    Type</InputLabel>
                                <Select
                                    labelId="flow-cons-select-label"
                                    onChange={event => handleFlowConstructorSelection(event)}
                                    value={flowData.activeConstructor} fullWidth>
                                    {
                                        Object.keys(registeredFlow.flowParamsMap).map((constructor, index) => {
                                            return (
                                                <MenuItem key={index} value={constructor}>{constructor}</MenuItem>
                                            );
                                        })
                                    }
                                </Select>
                            </div>
                        </FormControl>
                    </div>
                </Grid>
            </Grid>
            <div>
                {
                    renderParamForm(false)
                }
                <div style={{width: "100%", float: "left", marginTop: 10, scroll: "auto"}}>
                    {
                        flowData.activeConstructor && !showFlowResult ?
                            <Button
                                style={{float: "right", marginTop: 10}}
                                onClick={() => startFlow()}
                                variant="contained"
                                color="primary"
                                disabled={isFlowInProgress}>
                                {isFlowInProgress ? 'Please Wait...' : 'Execute'}
                            </Button>
                            : null
                    }
                    {
                        showFlowResult ?
                            isFlowSuccessful ?
                                <GreenButton style={{float: "right", marginTop: 10}}>Flow Successful</GreenButton> :
                                <RedButton style={{float: "right", marginTop: 10}}>Flow Failed</RedButton> :
                            null
                    }
                </div>
            </div>
        </div>
    )

    function handleFlowConstructorSelection(event) {
        setFlowData({
            ...flowData,
            activeConstructor: [event.target.value],
            flowParams: registeredFlow.flowParamsMap[event.target.value],
            paramsList: registeredFlow.flowParams
        })
        // setActiveConstructor([event.target.value])
        // setFlowParams(registeredFlow.flowParamsMap[event.target.value])
        // setParamList(registeredFlow.flowParams)
    }

    function getParties() {
        http.get(urls.get_parties)
            .then(r => {
                if (r.status === 200 && r.data.status === true) {
                    const filteredParties = r.data.data.filter(party => !party.includes(NODE_ID) && !party.includes("Notary"))
                    setFlowData({
                        ...flowData,
                        parties: filteredParties
                    })
                    // setParties(filteredParties)
                }
            }).catch(error => {
            console.log("Error fetching parties")
            console.error(error)
        });
        return flowData.parties
    }


    function startFlow() {
        setFlowInProgress(true)
        let flowInfo = {
            flowName: registeredFlow.flowName,
            flowParams: flowData.flowParams
        }

        http.post(urls.start_flow, flowInfo)
            .then(({data}) => {
                if (data.status) {
                    console.log("Flow completed: " + flowInfo.flowName)
                    addFlowToHistory(true)
                }
            }).catch(error => {
            addFlowToHistory(false)
            console.log("Error running flow: " + flowInfo.flowName)
            console.error(error)
        });
    }

    function addFlowToHistory(completionStatus) {
        setFlowInProgress(false)
        setFlowSuccessful(completionStatus)
        let flowName = trimFlowsForDisplay(registeredFlow.flowName)
        let newFlow = {
            flowName: flowName,
            flowCompletionStatus: completionStatus
        }
        setCompletedFlows([...completedFlows, newFlow])
        setShowFlowResult(true)
        setTimeout(() => {
            toggleModal();
        }, 1);
    }

    function updateListParam(param, val, flag, idx) {
        if (flag) {
            if (param.paramValue === undefined || param.paramValue === null)
                param.paramValue = []
            param.paramValue.push(val);
            let keyVal = [];
            keyVal[param.paramName] = param.paramValue;
            setFlowData({
                ...flowData,
                paramList: keyVal
            })
            // setParamList(keyVal)
        } else {
            param.paramValue.splice(idx, 1);
            flowData.paramList[param.paramName].splice(idx, 1)
            let keyVal = [];
            keyVal[param.paramName] = flowData.paramList[param.paramName];
            setFlowData({
                ...flowData,
                paramList: keyVal
            })
        }
    }

    function updateCmplxListParam(param, flag, idx) {
        if (flag) {
            let obj = JSON.parse(JSON.stringify(param.paramValue[0]));
            param.paramValue.push(obj);
            let keyVal = [];
            if (!(flowData.paramList[param.paramName] === undefined || flowData.paramList[param.paramName] === null)) {
                keyVal[param.paramName] = flowData.paramList[param.paramName];
            } else {
                keyVal[param.paramName] = [];
            }
            if (keyVal[param.paramName].length === 0) {
                obj.key = 0;
            } else {
                obj.key = keyVal[param.paramName][keyVal[param.paramName].length - 1].key + 1;
            }
            keyVal[param.paramName].push(obj);
            setFlowData({
                ...flowData,
                paramList: keyVal
            })
        } else {
            param.paramValue.splice(idx + 1, 1);
            flowData.paramList[param.paramName].splice(idx, 1);
            let keyVal = [];
            keyVal[param.paramName] = flowData.paramList[param.paramName];
            setFlowData({
                ...flowData,
                paramList: keyVal
            })
        }
    }

    function getHelperText(paramType) {
        switch (paramType) {
            case 'net.corda.core.contracts.Amount':
                return 'Param Type: ' + paramType + ' eg: 100 USD';

            case 'java.lang.Boolean':
            case 'boolean':
                return 'Param Type: ' + paramType + ' eg: true or false';

            case 'java.time.LocalDateTime':
            case 'java.time.Instant':
                return 'Param Type: ' + paramType + ' eg: 10/02/2020 10:12:30 AM';

            case 'net.corda.core.utilities.OpaqueBytes':
                return 'Param Type: ' + paramType + ', Enter String value';

            default:
                return 'Param Type: ' + paramType;
        }
    }
}

const GreenButton = withStyles((theme) => ({
    root: {
        color: lightGreen[50],
        backgroundColor: lightGreen[500],
    },
}))(Button);

const RedButton = withStyles((theme) => ({
    root: {
        color: pink[50],
        backgroundColor: pink[500],

    },
}))(Button);

export default FlowParameters