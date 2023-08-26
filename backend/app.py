from flask import Flask, request, jsonify
import pandas as pd
from flask_cors import CORS
from io import StringIO
import openai
import os

app = Flask(__name__)
CORS(app)

openai.api_key = os.environ.get('OPENAI_API_KEY')

def load_demo_csv():
    df = pd.read_csv("./backend/demo_data_og.csv")
    return df

def make_openai_demo_query(option): # Mock of openai call
    if option == "split":
        return "dataframe[['Last Name', 'First Name']] = dataframe['Name'].str.split(', ', n=1, expand=True)"
    if option == "organize":
        return "dataframe = dataframe[['First Name', 'Last Name', 'ID', 'Place']]"
    if option == "delete":
        return "dataframe.drop('Name', axis=1, inplace=True, errors='ignore')"

def make_openai_query(prompt):
    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt="""
        Only output python3. Do not write any text to explain. 
        I should be directly able to execute your output on my computer using python's exec method, so make sure it is safe. 
        Below, I provide the Columns of data and user's prompt. 
        Convert that prompt to pandas code. Call the dataframe variable object "dataframe". 
        Do not write any imports, use libraries other than pandas and numpy, or define the dataframe variable.
        Either perform all operations in_place or start the command with "dataframe = ".
        There should not be any print operations or commands that don't edit the dataframe permanently.
        Operations should all return string values. If operation outputs boolean, it should output "True" and "False" strings

        Here are some examples of Prompt and response pairs that align with the above constraints:
        * Prompt: Split Z column into X and Y columns by ,
          Response: dataframe[['X', 'Y']] = dataframe['Z'].str.split(',', expand=True)
        * Prompt: Delete the X column
          Response: dataframe.drop('X', axis=1, inplace=True)
        * Prompt: Rearrange the X and Y columns to go before Z
          Response: dataframe = dataframe[['X', 'Y', 'Z']]

        Columns: {}
        Prompt: {}
        """.format(final_dataframe.columns.tolist(), prompt),
        max_tokens=60
    )
    answer = response["choices"][0]["text"].strip()
    print(answer)
    return answer

final_dataframe = pd.DataFrame()
command_to_execute = ""
last_step = 0

@app.route('/', methods=['GET'])
def hello_world():
    return jsonify(message='Visit the frontend to view this app')

@app.route('/api/load_demo', methods=['GET'])
def load_demo():
    global final_dataframe
    final_dataframe = load_demo_csv()
    print(final_dataframe)
    return jsonify(message='Loaded demo CSV!')

@app.route('/api/file_upload', methods=['POST'])
def file_upload():
    global final_dataframe
    body = request.json
    content = StringIO(body["content"])
    final_dataframe = pd.read_csv(content, sep=",")
    response = {
        'preview':  final_dataframe.head().to_json()
    }
    return jsonify(response)

@app.route('/api/file_download', methods=['GET'])
def file_download():
    global final_dataframe
    response = {
        'contents': final_dataframe.to_csv(index=False)
    }
    return jsonify(response)

@app.route('/api/manipulate', methods=['POST'])
def manipulate():
    global last_step
    global command_to_execute

    prompt = request.json["prompt"]
    step = request.json["step"]
    command = ""

    if step != last_step:
        command = command_to_execute.replace("dataframe", "final_dataframe")
        print("tried executing: global final_dataframe; " + command)
        exec("global final_dataframe; " + command)
        global final_dataframe
        print(final_dataframe)
        last_step = step # last step's command has been executed

    dataframe = final_dataframe.copy(deep=True)

    if prompt:
        try:
            command = make_openai_query(prompt)
            exec(command)
            command_to_execute = command
        except:
            print("Something went wrong")
        finally:
            print("Tried executing: {}".format(command))

    print(dataframe.head())
    response = {
        'preview': dataframe.head().to_json(),
        'command': command
    }
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)
