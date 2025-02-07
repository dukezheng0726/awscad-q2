const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand,  PutCommand } = require('@aws-sdk/lib-dynamodb');
const ddbClient = new DynamoDBClient({ region: 'ca-central-1' });  
const dynamoDB = DynamoDBDocumentClient.from(ddbClient)


const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const { httpMethod, pathParameters, body } = event;
  const id = pathParameters ? pathParameters.id : null;

  if (httpMethod === 'POST') {
    const { name } = JSON.parse(body);

    if (!name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Name is required' }),
      };
    }

    const item = {
      id: id || Math.floor(Math.random() * 10000).toString(),
      name,
      timestamp: new Date().toISOString(),
    };

    try {
      // 使用 PutCommand 插入数据
      await dynamoDB.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: item
      }));

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Item inserted!', item }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error inserting item', error }),
      };
    }
  }

  
    if (httpMethod === 'GET') {
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'ID is required' }),
        };
      }
  
      try {
        const result = await dynamoDB.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
        }));
        
        return {
          statusCode: 200,
          body: JSON.stringify(result.Item || { message: 'Item not found!' }),
        };
      } catch (error) {
        console.error('Error fetching item:', error);  // 打印错误信息
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Error fetching item', error: error.message }),
        };
      }
    }
  
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Unsupported method!' }),
    };
};