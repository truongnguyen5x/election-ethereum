import React, {Component} from "react";
import LinearProgress from "@material-ui/core/LinearProgress";
import {Button, Grid, Table, TableBody, TableCell, TableRow} from "@material-ui/core";

import Web3 from "web3";
import API from "../core/api_constants";
import contract from "truffle-contract";
import MyContractJSON from "../contracts/build/Election";
import InputLabel from "@material-ui/core/InputLabel";
import Input from "@material-ui/core/Input";
import FormControl from "@material-ui/core/FormControl";
import TableHead from "@material-ui/core/TableHead";

class ElectionAdmin extends Component {
    constructor(props) {
        super(props);
        this.state = {
            error: '',
            loading: false,
            isVoting: false,
            voters: [],
            proposal: [],
            numberProposal: 1
        }
    }

    componentDidMount() {
        const web3 = new Web3(Web3.givenProvider || API.PROVIDER_URL);
        const MyContract = contract(MyContractJSON);
        MyContract.setProvider(web3.eth.givenProvider);
        MyContract.deployed().then(instance => {
            this.setState({instance: instance});
            console.log('instance', instance);
            return instance;
        }).then(() => {
            return web3.eth.getCoinbase();
        }).then(account => {
            console.log('accout', account);
            this.setState({account: account});
            return this.state.instance.isVoting();
        }).then(isVoting => {
            console.log('is voting', isVoting);
            this.setState({isVoting: isVoting});
            return this.state.instance.getProposal();
        }).then(proposal => {
            console.log('proposal', proposal);
            this.setState({proposal: proposal});
            return this.state.instance.getVoters();
        }).then(voters => {
            voters.shift();
            console.log('voter', voters);
            this.setState({voters: voters});
        })

            .catch(err => {
                console.log(err)
            });

    }

    onChange = (event) => {
        const value = event.target.value;
        if (value < 1 || value >= this.state.proposal.length) {
            this.setState({error: 'Số người phải lớn hơn 0 và nhỏ hơn số ứng cử viên ' + this.state.proposal.length});
            return;
        } else {
            this.setState({error: ''})
        }
        this.setState({numberProposal: value});

    };
    start = () => {
        this.setState({loading: true});
        const {numberProposal, proposal, instance, account} = this.state;
        if (numberProposal >= 1 && numberProposal < proposal.length) {
            instance.start(numberProposal, {from: account}).then(result => {
                console.log(result);
                this.setState({loading: false, isVoting: true})
            }).catch(err => {
                console.log(err);
                this.setState({loading: false})
            })
        }
    };

    end = () => {
        this.setState({loading: true});
        const {instance, account} = this.state;
        instance.end({from: account}).then(result => {
            console.log(result);
            this.setState({loading: false, isVoting: false})
        }).catch(err => {
            console.log(err);
            this.setState({loading: false})
        })
    };

    render() {
        const {isVoting, proposal} = this.state;
        return (
            <div>
                {this.state.loading && <LinearProgress color='secondary'/>}
                <h2 style={{marginLeft: '20px'}}>Quản lý bầu cử</h2>
                <Grid container style={{marginTop: '10px'}}>
                    <Grid item md={2}/>
                    <Grid item md={8}>
                        <div style={{fontSize: '20px'}}>
                            Trạng thái bầu cử: {this.state.isVoting ? 'Đang bầu cử' : "Không bầu cử"}
                        </div>
                        <div style={{marginTop: '10px'}}>
                            Số người được đề cử {this.state.proposal.length}
                        </div>
                        <div style={{marginTop: '10px'}}>
                            Số người đi bầu {this.state.voters.length}
                        </div>
                        {
                            isVoting ?
                                <div style={{marginTop: '15px'}}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Tên ứng cử viên</TableCell>
                                                <TableCell>Số phiếu đang có</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {proposal.map((item, index) =>
                                                <TableRow key={index}>
                                                    <TableCell>{item.name}</TableCell>
                                                    <TableCell>{item.voteCount}</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                    <Button style={{marginTop:'15px'}} variant='contained' color='primary' onClick={this.end}>Dừng bầu
                                        cử </Button>
                                </div> : <div style={{marginTop: '15px'}}>
                                    <FormControl margin="normal">
                                        <InputLabel htmlFor="email">Mỗi phiếu điền mấy người?</InputLabel>
                                        <Input type='number' onChange={this.onChange} style={{minWidth: '250px'}}
                                               onBlur={this.onChange}
                                               value={this.state.numberProposal} error={!!this.state.error}/>
                                    </FormControl>
                                    <div style={{color: 'red'}}>{!!this.state.error && this.state.error}</div>

                                    <div style={{marginTop: '20px'}}>
                                        <Button variant='contained' color='primary' onClick={this.start}>Bắt đầu bầu
                                            cử</Button></div>
                                </div>
                        }
                    </Grid>
                    <Grid item md={2}/>

                </Grid>

            </div>
        )
    }
}

export default ElectionAdmin;