FROM mcr.microsoft.com/azure-functions/python:4-python3.12

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true \
    FUNCTIONS_WORKER_RUNTIME=python

COPY requirements.txt /
RUN pip install -r /requirements.txt

COPY . /home/site/wwwroot

WORKDIR /home/site/wwwroot
