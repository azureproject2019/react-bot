import React, { Component } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';
import SwipeableViews from 'react-swipeable-views';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import FacebookLogin from 'react-facebook-login';
class App extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      userMessage: '',
	  conversation: [],
      userId : new Date().getTime(),
      toEmailModalOpen : false,
      isJiraModalOpened : false,
      isChatModalOpened : false,
      toEmailAddress : '',
      isAuthenticated : false,
      jira : [{
        itemType:"",
        itemValue:""
      },{
        itemType:"Task",
        itemValue:"Task"
      },{
        itemType:"Story",
        itemValue:"Story"
      },{
        itemType:"Bug",
        itemValue:"Bug"
      }],
      selectedItemType:"",
      summary:"",
      description:""
    };
  }

  componentDidMount() {
    this.startListenerWebSocketClient();
    this.startPublisherWebSocketClient();
  }

  startListenerWebSocketClient() {
    this.listenSocket = new WebSocket("wss://reactbot-nodered-flow.herokuapp.com/public/messagepublish"); //server publishes
    this.listenSocket.onopen = () => {
      // on connecting, do nothing but log it to the console
    }

    function isHTML(str) {
      var doc = new DOMParser().parseFromString(str, "text/html");
      return Array.from(doc.body.childNodes).some(node => node.nodeType === 1);
    }

    function convertToMessage(str) {
      let convertedMessage='';
      if(typeof str == 'string') {
        convertedMessage=str;
      } else {
        try {
          let tempstr=JSON.stringify(str);
          JSON.parse(tempstr);
          convertedMessage=tempstr;
        } catch (e) {
          convertedMessage=str;
        }
      }
      return convertedMessage;
    }

    this.listenSocket.onmessage = event => {
      let response=JSON.parse(event.data.trim());
      if(response.userId === this.state.userId) {
          let message=response.data;
          if(isHTML(message)) {
              message='Some thing went wrong, please try again after some time.'
          }
          const msg = {
              text: convertToMessage(message),
              user: 'ai'
          };
          this.setState({
              conversation: [...this.state.conversation, msg],
          });
      }
    }

    this.listenSocket.onclose = () => {
      this.startListenerWebSocketClient();
    }

  }
  startPublisherWebSocketClient() {
    this.publishSocket = new WebSocket("wss://reactbot-nodered-flow.herokuapp.com/public/messagereceive");

    this.publishSocket.onopen = () => {
      // on connecting, do nothing but log it to the console
    }



    this.publishSocket.onmessage = evt => {
      const message = JSON.parse(evt.data);
      this.addMessage(message);
    }

    this.publishSocket.onclose = () => {
      this.startPublisherWebSocketClient();
    }

  }
  submitMessage = messageString => {
    const message = { channelType: 'chatbot', message: messageString, userId: this.state.userId }
    this.publishSocket.send(JSON.stringify(message))
  }
  handleChange = event => {
    this.setState({ userMessage: event.target.value });
  };


  handleSubmit = event => {
    event.preventDefault();
    if (!this.state.userMessage.trim()) return;

    const msg = {
      text: this.state.userMessage,
      user: 'human',
    };

    this.setState({
      conversation: [...this.state.conversation, msg],
    });

    this.submitMessage({
      message: this.state.userMessage,
    });

    this.setState({ userMessage: '' });
  };

  isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

  getContent(event, className, i) {
    if(event.user === 'human') {
      return (<div key={`${className}-${i+1}`} className={`${className} chat-bubble`}>
        <span className="chat-content">{event.text}</span>
      </div>);
    } else {
     if(this.isJson(event.text)) {
       const items=JSON.parse(event.text);
        return (
            <div className="card-container">
              {items.map((item) =>
                  <a className="card">
                    {Object.keys(item).map(function (key) {
                      return (
						  (<div><h6 className="room-detail">{key}</h6><span className="room-response">{item[key]}</span></div>)
                      )
                  }
                  )}
                  </a>
              )
              }
            </div>
        );
     } else {
       return (<div key={`${className}-${i}`} className={`${className} chat-bubble`}>
         <span className="chat-content">{event.text}</span>
       </div>);
     }
    }
  }

  sendEmail(conversation, publisher, toEmail) {
    const message = { channelType: 'email', message: conversation, subject: 'Chat History', to:toEmail };
    this.setState({toEmailModalOpen: false});
    publisher.send(JSON.stringify(message));
  }

  createJira(itemType,itemSummary,itemDescription,publisher) {
    let message = { channelType: 'jira', itemType: itemType, itemSummary: itemSummary, itemDescription };
    this.setState({isJiraModalOpened: false});
    publisher.send(JSON.stringify(message));
  }
  // editSlogan(){
  //   return (
  //       // <input type="text" value={this.props.slogan} onChange={this.saveEdit}/>

  //   );
  // }
  render() {
    const handleEmailModalClick = (toEmailModalOpen) => {
      this.setState({toEmailModalOpen: toEmailModalOpen, toEmailAddress : ''});
    }
    const handleJiraModalClick = (isJiraModalOpened) => {
      this.setState({isJiraModalOpened: isJiraModalOpened});
    }
    const handleChatModalClick = (isChatModalOpened) => {
      if(this.state.isAuthenticated){
        this.setState({isChatModalOpened: !isChatModalOpened});
      }
    }


    const handleToEmailAddressChange = event => {
      this.setState({ toEmailAddress: event.target.value });
    };

    const handleJiraDescriptionChange = event => {
      this.setState({description: event.target.value});
    }

    const handleJiraSummaryChange = event => {
      this.setState({summary: event.target.value});
    }
    const responseFacebook = (response) => {
          if(response.userID !== undefined) {
            this.setState({isAuthenticated: true, isChatModalOpened:true});
          }
      }

     const ChatBubble = (event, i, className) => {
      return (
          <div>{this.getContent(event, className, i)}</div>
      );
    };



    const chat = this.state.conversation.map((e, index) =>
      ChatBubble(e, index, e.user)
    );
    const mailIcon=require('./icons8-send-mail-100.png');
    const closeIcon=require('./error.png');
    const mailIdIcon=require('./icons8-send-mail-100 (1).png')
    const jiraTicketIcon=require('./ticket.png');
    const FacebookIcon=require('./facebook.png');
    const googleIcon=require('./search.png');
    const twitterIcon=require('./twitter.png');
    const emailIcon=require('./email.png');

    return (
        <div id="chat">
          {/* <div className="col-md-12">
              <h1>{this.props.name}</h1>
              <p onClick={this.editSlogan}>Hello</p>
          </div> */}

        <div className="chat-button-theme-bubble">
          <div className="button-greeting">
            <div className="button-greeting-close" >
            <svg

              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z">
              </path> 
              <path 
                d="M0 0h24v24H0z" 
                fill="none">
              </path>
            </svg>
            </div>
            {/* <div className="button-greeting-content-wrapper">
              <div className="button-greeting-content">Hey I'm a ChatBot!</div>
            </div> */}
          </div>
          <div className="chat-button"  >
            <svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20" className="chat-icon"
                 onClick={() => handleChatModalClick(this.state.isChatModalOpened)}
            >
            <path
              className="chat-path" 
              d="M9.37,1.34H10.8a8.2,8.2,0,0,1,0,16.39H9.37a10,10,0,0,1-2.68-.45c-.55-.15-2.23,1.81-2.63,1.36s.05-2.79-.41-3.23q-.28-.27-.54-.57A8.2,8.2,0,0,1,9.37,1.34Z"
             >
            </path> 
            <line 
              className="chat-line"
              x1="6.37"
              y1="7.04"
              x2="12.58" 
              y2="7.04" 
              >
            </line> 
            <line 
              className="chat-line"
              x1="6.37" 
              y1="9.66" 
              x2="14.31" 
              y2="9.66" 
              >
            </line> 
            <line 
              className="chat-line"
              x1="6.37" 
              y1="12.28" 
              x2="11.42" 
              y2="12.28" 
              >
            </line>
            </svg>
          </div>
        </div>
          {this.state.isAuthenticated  ? (
              <div>
                { this.state.isChatModalOpened? (
          <div id="chatbot-open" className="chat-window chat-modal-window">
            <div className="chat-heading">
              <h1 className="animate-chat">React Chatbot</h1>
              <div className="interior">
              <div>
                {/* <button type="button" className="btn btn-primary"  data-toggle="modal" data-target="#exampleModalCenter">Login</button> */}
                {/* <img className="mail-box" onClick={() => this.sendEmail(this.state.conversation, this.publishSocket)} src={mailIcon} title="Send Conversation"/> */}
                <a  href="#open-modal"><img className="mailId-box" src={mailIdIcon} title="Enter Your Mail"  onClick={() => handleEmailModalClick(true)} /></a>
                <a  href="#open-jira-modal"><img className="mailId-box" src={jiraTicketIcon} onClick={() => handleJiraModalClick(true)}  title="Jira"/></a>
              </div>
              </div>
              {this.state.toEmailModalOpen ? (  
              <div id="open-modal" className="modal-window">
                <div>
                <a href="#" title="Close" className="modal-close"><img className="close-icon" src={closeIcon}/></a>
                  <form className="form">
                  <div className="form-group">
                    <label for="exampleFormControlInput1">Email address</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      id="exampleFormControlInput1" 
                      placeholder="Your E-Mail Address"
                      value={this.state.toEmailAddress}
                      onInput={handleToEmailAddressChange}
                      />
                  </div>
	                  {/* <input type="email" class="form__field" placeholder="Your E-Mail Address" /> */}
                    <div className="d-flex justify-content-center">
			              <button type="button"
                      onClick={() => this.sendEmail(this.state.conversation, this.publishSocket, this.state.toEmailAddress)}
                      className="btn btn--primary btn--inside uppercase">Send</button>
			              <button type="button" onClick={() => handleEmailModalClick(false)}
                      className="btn btn--danger btn--inside uppercase"
                    >
                    Close
                    </button>
                    </div>
                  </form>
                </div>
              </div>
              ):(
                ""
              )}
              {this.state.isJiraModalOpened ? (
              <div id="open-jira-modal" className="modal-window">
                <div>
                <a href="#" title="Close" className="modal-close"><img className="close-icon" src={closeIcon}/></a>
                <form className="form">
                  <div className="form-group">
                    <label for="exampleFormControlSelect1">Issue Type</label>
                    <select className="form-control" id="exampleFormControlSelect1" value={this.state.selectedItemType}
                            onChange={
                              (e) => this.setState({selectedItemType: e.target.value})
                            }>
                      {this.state.jira.map((itemType) => <option key={itemType.itemValue} value={itemType.itemValue}>{itemType.itemValue}</option>)}
                    </select>

                    {/*<select className="form-control" id="exampleFormControlSelect1">
                      <option>Story</option>
                      <option>Task</option>
                      <option>Epic</option>
                      <option >Bug</option>
                    </select>*/}
                  </div>
                  <div className="form-group">
                    <label htmlFor="exampleFormControlTextarea2">Summary</label>
                    <textarea className="form-control" id="exampleFormControlTextarea2" value={this.state.summary}
                              onInput={handleJiraSummaryChange}/>
                  </div>
                  <div className="form-group">
                    <label for="exampleFormControlTextarea1">Description</label>
                    <textarea className="form-control" id="exampleFormControlTextarea1" value={this.state.description}
                              onInput={handleJiraDescriptionChange}/>
                  </div>

                  <div className="d-flex justify-content-center">
			              <button onClick={() => this.createJira(this.state.selectedItemType, this.state.summary, this.state.description, this.publishSocket)}
                                  type="button" className="btn btn--primary btn--inside uppercase">Create</button>
			              <button type="button" className="btn btn--danger btn--inside uppercase" onClick={() => handleJiraModalClick(false)} >Close</button>
                  </div>
                  </form>
                </div>
              </div>
              ):(
                  ""
              )}
              </div>

                <ScrollToBottom className="conversation-view ">

                  <div  id={'chathistory'}>{chat}</div>
                  <div className="ticontainer">
                    <div className="tiblock">
                      <div className="tidot"></div>
                      <div className="tidot"></div>
                      <div className="tidot"></div>
                    </div>
                  </div>
                  </ScrollToBottom>
                  <form onSubmit={this.handleSubmit}>
                  <input
                      value={this.state.userMessage}
                      onInput={this.handleChange}
                      className="css-input"
                      type="text"
                      autoFocus
                      placeholder="Type your message and hit Enter to send"    />
                </form>
            </div>
                ):(
                    ""
                )}
              </div>
          ):(  <div id="open-login-modal" className="modal-login  modal-login-window d-flex justify-content-center">
                <div >
                  <div className="modal-text">
                    <h3 className="modal-header">Welcome Back</h3>
                    <p>Sign in to get personalized story recommendations, follow authors and topics you love, and interact with stories.</p>
                    <FacebookLogin
                        appId="371181973549385" //APP ID NOT CREATED YET
                        fields="name,email,picture"
                        callback={responseFacebook}
                        className="btn btn--primary--outline"
                    />
                  </div>
                </div>
              </div>
          )}

		</div>
    );
  }
}
export default App;