const Streamz = require('streamz');
const util = require('util');
const getSqsBulkLoader = require("sqs-bulk-loader");

function get(obj, path) {
  return path.split('.').reduce((parent, child)=> parent && parent[child]||null, obj)
}

function Bulk(queueUrl,sqsClient,idKey,options) {
  if (!(this instanceof Bulk))
    return new Bulk(queueUrl,sqsClient,idKey,options);
  
  let sqsBulkLoader = getSqsBulkLoader();
  if (sqsClient) {
    sqsBulkLoader = getSqsBulkLoader(sqsClient);
  }
  Streamz.call(this,options);
  this.options = options || {"batchSize": 10};
  this.queueUrl = queueUrl;
  this.sqsBulkLoader = sqsBulkLoader;
  this.idKey = idKey;
}
util.inherits(Bulk,Streamz);
Bulk.prototype._fn = function(d) {
  let messages = [].concat(d);
  // if messages has Id and MessageBody, send them as it is
  // else wrap them in Messagebody.
  if(!messages.every(msg => msg.Id) || !messages.every(msg => msg.MessageBody)) {
    messages = messages.map(message => {
      return {
        "Id": get(message, this.idKey || "_id" || "id"),
        "MessageBody": JSON.stringify(message)
      }
    });
  }
  const execute = () => {
    return this.sqsBulkLoader.sendBatchedMessagesInParallel(this.queueUrl, messages, {"batchSize": this.options.batchSize});
  };
  return execute();
};
module.exports = Bulk;